import { CfnOutput, Duration } from "aws-cdk-lib";
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from "constructs";
import { Config } from "../config";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { VideoStorage } from "../constructs/video-storage";
import { env } from "../env";

type AdminApiComponentProps = {
  videoStorage: VideoStorage;
};

export class AdminApiComponent extends Construct {
  readonly apiEndpoint: string;

    constructor(scope: Construct, id: string, props: AdminApiComponentProps) {
      super(scope, id);

      const { videoStorage } = props;

      // API Gateway for video operations
      const api = new apigateway.RestApi(this, `${Config.appName}-video-api`, {
        restApiName: `${Config.appName}-video-api`,
        description: 'API for video operations',
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
        },
      });

      // CloudFront distribution for API Gateway
      // TODO: API must be protected
      const distribution = new cloudfront.Distribution(this, `${Config.appName}-api-distribution`, {
        comment: `${Config.appName} Admin API Distribution`,
        defaultBehavior: {
          origin: new cloudfront_origins.RestApiOrigin(api, {
            originPath: '/',
          }),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
        defaultRootObject: '',
      });

      const videoCreateUploadSignedUrlFn = new nodejs.NodejsFunction(this, `${Config.appName}-video-create-upload-signed-url-fn`, {
        functionName: `${Config.appName}-video-create-upload-signed-url-fn`,
        description: 'Lambda function to generate presigned URLs for video uploads',
        entry: 'admin-api/lambdas/video-create-upload-signed-url-fn/index.ts',
        handler: 'handler',
        logRetention: RetentionDays.ONE_DAY,
        timeout: Duration.seconds(2),
        environment: {
          BUCKET_NAME: videoStorage.s3.bucketName,
        },
      });
      videoStorage.s3.grantReadWrite(videoCreateUploadSignedUrlFn); // Grant permissions to read/write to the S3 bucket, TODO: do I we need this?
      const videoCreateUploadSignedUrlFnIntegration = new apigateway.LambdaIntegration(videoCreateUploadSignedUrlFn);

      const videoSetMetadataFn = new nodejs.NodejsFunction(this, `${Config.appName}-video-set-metadata-fn`, {
        functionName: `${Config.appName}-video-set-metadata-fn`,
        description: 'Lambda function to set video metadata',
        entry: 'admin-api/lambdas/video-set-metadata-fn/index.ts',
        handler: 'handler',
        logRetention: RetentionDays.ONE_DAY,
        timeout: Duration.seconds(2),
        environment: {
          POSTGRES_HOST: env.USER_API_DB_HOST,
          POSTGRES_PORT: env.USER_API_DB_PORT,
          POSTGRES_NAME: env.USER_API_DB_NAME,
          POSTGRES_USER: env.USER_API_DB_USER,
          POSTGRES_PASS: env.USER_API_DB_PASS,
        },
      });
      const videoSetMetadataFnIntegration = new apigateway.LambdaIntegration(videoSetMetadataFn);

      const videoSearchFn = new nodejs.NodejsFunction(this, `${Config.appName}-video-search-fn`, {
        functionName: `${Config.appName}-video-search-fn`,
        description: 'Lambda function to search videos by title, description, or tags',
        entry: 'admin-api/lambdas/video-search-fn/index.ts',
        handler: 'handler',
        logRetention: RetentionDays.ONE_DAY,
        timeout: Duration.seconds(2),
        environment: {
          POSTGRES_HOST: env.USER_API_DB_HOST,
          POSTGRES_PORT: env.USER_API_DB_PORT,
          POSTGRES_NAME: env.USER_API_DB_NAME,
          POSTGRES_USER: env.USER_API_DB_USER,
          POSTGRES_PASS: env.USER_API_DB_PASS,
        },
      });
      const videoSearchFnIntegration = new apigateway.LambdaIntegration(videoSearchFn);

      // Create API resources and methods
      const videosResource = api.root.addResource('videos');
      const searchResource = videosResource.addResource('search');
      const uploadResource = api.root.addResource('upload');
      const presignedUrlResource = uploadResource.addResource('presigned-url');
      const metadataResource = videosResource.addResource('metadata');

      // Set up API endpoints
      presignedUrlResource.addMethod('POST', videoCreateUploadSignedUrlFnIntegration);
      metadataResource.addMethod('PUT', videoSetMetadataFnIntegration);
      searchResource.addMethod('GET', videoSearchFnIntegration);

      // Create an IAM policy that allows the presigned URL Lambda to invalidate CloudFront
      const cloudfrontInvalidationPolicy = new iam.PolicyStatement({
        actions: ['cloudfront:CreateInvalidation'],
        resources: ['*'], // For CloudFront invalidations, the resource has to be '*'
      });

      // Add this policy to the Lambda's role
      videoSetMetadataFn.addToRolePolicy(cloudfrontInvalidationPolicy);
      videoSetMetadataFn.addEnvironment('DISTRIBUTION_ID', videoStorage.distribution.distributionId);

      // Store the API endpoint URL for reference
      this.apiEndpoint = api.url;

      // Outputs
      new CfnOutput(this, `${Config.appName}-video-s3-url`, {
        description: 'S3 bucket URL for video uploads',
        value: videoStorage.s3.bucketWebsiteUrl,
      });
      new CfnOutput(this, `${Config.appName}-api-url`, {
        description: 'API Gateway URL for video operations',
        value: api.url,
      });
      new CfnOutput(this, `${Config.appName}-distribution-domain`, {
        description: 'CloudFront distribution domain for video streaming',
        value: videoStorage.distribution.domainName,
      });
      new CfnOutput(this, `${Config.appName}-distribution-id`, {
        description: 'CloudFront distribution ID for video streaming',
        value: videoStorage.distribution.distributionId,
      });
      new CfnOutput(this, `${Config.appName}-cloudfront-api-url`, {
        description: 'CloudFront URL that fronts API Gateway',
        value: distribution.domainName,
      });
    }
}
