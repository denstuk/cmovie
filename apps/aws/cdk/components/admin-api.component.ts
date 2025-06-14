import { CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from "constructs";
import { Config } from "../config";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { VideoStorage } from "../constructs/video-storage";

type AdminApiComponentProps = {
  videoStorage: VideoStorage;
};

export class AdminApiComponent extends Construct {
  readonly apiEndpoint: string;

    constructor(scope: Construct, id: string, props: AdminApiComponentProps) {
      super(scope, id);

      const { videoStorage } = props;

      // DynamoDB for Video Metadata
      const videoTable = new dynamodb.Table(this, `${Config.appName}-videos-table`, {
        partitionKey: { name: 'video_id', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.DESTROY,
      });

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
      // TODO: API must be accessible ONLY via CloudFront
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
          TABLE_NAME: videoTable.tableName,
        },
      });
      videoTable.grantReadWriteData(videoSetMetadataFn); // Grant permissions to read/write to the DynamoDB table
      const videoSetMetadataFnIntegration = new apigateway.LambdaIntegration(videoSetMetadataFn);

      const videoSearchFn = new nodejs.NodejsFunction(this, `${Config.appName}-video-search-fn`, {
        functionName: `${Config.appName}-video-search-fn`,
        description: 'Lambda function to search videos by title, description, or tags',
        entry: 'admin-api/lambdas/video-search-fn/index.ts',
        handler: 'handler',
        logRetention: RetentionDays.ONE_DAY,
        timeout: Duration.seconds(2),
        environment: {
          TABLE_NAME: videoTable.tableName,
        },
      });
      videoTable.grantReadData(videoSearchFn); // Grant read-only permissions for the search function
      const videoSearchFnIntegration = new apigateway.LambdaIntegration(videoSearchFn);

      const videoGetByIdFn = new nodejs.NodejsFunction(this, `${Config.appName}-video-get-by-id-fn`, {
        functionName: `${Config.appName}-video-get-by-id`,
        description: 'Lambda function to get video metadata by ID',
        entry: 'admin-api/lambdas/video-get-by-id-fn/index.ts',
        handler: 'handler',
        logRetention: RetentionDays.ONE_DAY,
        timeout: Duration.seconds(2),
        environment: {
          TABLE_NAME: videoTable.tableName,
        },
      });
      videoTable.grantReadData(videoGetByIdFn); // Grant read-only permissions
      const videoGetByIdFnIntegration = new apigateway.LambdaIntegration(videoGetByIdFn);

      const videoCreateViewSignedUrlFn = new nodejs.NodejsFunction(this, `${Config.appName}-video-create-view-signed-url-fn`, {
        functionName: `${Config.appName}-video-create-view-signed-url-fn`,
        description: 'Lambda function to generate presigned URLs for viewing videos',
        entry: 'admin-api/lambdas/video-create-view-signed-url-fn/index.ts',
        handler: 'handler',
        logRetention: RetentionDays.ONE_DAY,
        environment: {
          CF_KEY_PAIR_ID: videoStorage.key.publicKeyId,
          CF_PRIVATE_KEY: Config.cloudFrontPrivateKey,
          TABLE_NAME: videoTable.tableName,
        },
        timeout: Duration.seconds(30),
      });
      videoTable.grantReadData(videoCreateViewSignedUrlFn); // Grant read-only permissions
      const videoCreateViewSignedUrlFnIntegration = new apigateway.LambdaIntegration(videoCreateViewSignedUrlFn);

      // Create API resources and methods
      const videosResource = api.root.addResource('videos');
      const searchResource = videosResource.addResource('search');
      const uploadResource = api.root.addResource('upload');
      const presignedUrlResource = uploadResource.addResource('presigned-url');
      const metadataResource = videosResource.addResource('metadata');
      const videoByIdResource = videosResource.addResource('{id}');
      const videoByIdPresignedUrlResource = videoByIdResource.addResource('presigned-url');

      // Set up API endpoints
      presignedUrlResource.addMethod('POST', videoCreateUploadSignedUrlFnIntegration);
      metadataResource.addMethod('PUT', videoSetMetadataFnIntegration);
      searchResource.addMethod('GET', videoSearchFnIntegration);
      videoByIdResource.addMethod('GET', videoGetByIdFnIntegration);
      videoByIdPresignedUrlResource.addMethod('POST', videoCreateViewSignedUrlFnIntegration);

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
