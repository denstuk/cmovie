import { CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";
import { Config } from "../config";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { VideoStorage } from "./video-storage";
import { readFileSync } from "fs";
import { join } from "path";

// Align names between lambdas and operations: Replace somewhere get with generate

export class VideoStreamStack extends Construct {
  readonly apiEndpoint: string;

    constructor(scope: Construct, id: string) {
      super(scope, id);

      const videoStorage = new VideoStorage(scope, `${Config.appName}-video-storage`);

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

      // Lambda function for generating presigned URLs
      const getPresignedUploadUrlFn = new nodejs.NodejsFunction(this, `${Config.appName}-get-presigned-upload-url-fn`, {
        entry: 'lambdas/get-presigned-upload-url-fn/index.ts',
        handler: 'handler',
        logRetention: RetentionDays.ONE_DAY,
        environment: {
          BUCKET_NAME: videoStorage.s3.bucketName,
          DISTRIBUTION_ID: '', // Will be updated after distribution is created
        },
        timeout: Duration.seconds(30),
      });
      videoStorage.s3.grantReadWrite(getPresignedUploadUrlFn); // Grant permissions to read/write to the S3 bucket
      const getPresignedUploadUrlIntegration = new apigateway.LambdaIntegration(getPresignedUploadUrlFn);

      // Lambda function for updating video metadata
      const setVideoMetaFn = new nodejs.NodejsFunction(this, `${Config.appName}-set-video-meta-fn`, {
        entry: 'lambdas/set-video-meta-fn/index.ts',
        handler: 'handler',
        logRetention: RetentionDays.ONE_DAY,
        environment: {
          TABLE_NAME: videoTable.tableName,
        },
        timeout: Duration.seconds(30),
      });
      videoTable.grantReadWriteData(setVideoMetaFn); // Grant permissions to read/write to the DynamoDB table
      const setVideoMetaIntegration = new apigateway.LambdaIntegration(setVideoMetaFn);

      // Lambda function for video search
      const videoSearchFn = new nodejs.NodejsFunction(this, `${Config.appName}-video-search-fn`, {
        entry: 'lambdas/video-search-fn/index.ts',
        handler: 'handler',
        logRetention: RetentionDays.ONE_DAY,
        environment: {
          TABLE_NAME: videoTable.tableName,
        },
        timeout: Duration.seconds(30),
      });
      videoTable.grantReadData(videoSearchFn); // Grant read-only permissions for the search function
      const videoSearchIntegration = new apigateway.LambdaIntegration(videoSearchFn);

      // Lambda function for getting a video by ID
      const getVideoByIdFn = new nodejs.NodejsFunction(this, `${Config.appName}-get-video-by-id-fn`, {
        entry: 'lambdas/get-video-by-id-fn/index.ts',
        handler: 'handler',
        logRetention: RetentionDays.ONE_DAY,
        environment: {
          TABLE_NAME: videoTable.tableName,
        },
        timeout: Duration.seconds(30),
      });
      videoTable.grantReadData(getVideoByIdFn); // Grant read-only permissions
      const getVideoByIdIntegration = new apigateway.LambdaIntegration(getVideoByIdFn);

      // Lambda function for generating signed URLs for video playback
      const getPresignedVideoUrlFn = new nodejs.NodejsFunction(this, `${Config.appName}-video-get-presigned-url-fn`, {
        entry: 'lambdas/video-get-presigned-url-fn/index.ts',
        handler: 'handler',
        logRetention: RetentionDays.ONE_DAY,
        environment: {
          CF_KEY_PAIR_ID: videoStorage.key.publicKeyId,
          CF_PRIVATE_KEY: readFileSync(join(__dirname, '../../secrets/cf_private_key.pem'), 'utf-8'),
        },
        timeout: Duration.seconds(30),
      });
      const getPresignedVideoUrlFnIntegration = new apigateway.LambdaIntegration(getPresignedVideoUrlFn);



      // Create API resources and methods
      const videosResource = api.root.addResource('videos');
      const searchResource = videosResource.addResource('search');
      const uploadResource = api.root.addResource('upload');
      const presignedUrlResource = uploadResource.addResource('presigned-url');
      const metadataResource = videosResource.addResource('metadata');
      const videoByIdResource = videosResource.addResource('{id}');
      const videoByIdPresignedUrlResource = videoByIdResource.addResource('presigned-url');

      // Set up API endpoints
      presignedUrlResource.addMethod('POST', getPresignedUploadUrlIntegration); // Generate presigned URL
      metadataResource.addMethod('PUT', setVideoMetaIntegration); // Set video metadata
      searchResource.addMethod('GET', videoSearchIntegration); // Search all videos
      videoByIdResource.addMethod('GET', getVideoByIdIntegration); // Get single video by ID
      videoByIdPresignedUrlResource.addMethod('POST', getPresignedVideoUrlFnIntegration); // Get presigned video URL

      // Create an IAM policy that allows the presigned URL Lambda to invalidate CloudFront
      const cloudfrontInvalidationPolicy = new iam.PolicyStatement({
        actions: ['cloudfront:CreateInvalidation'],
        resources: ['*'], // For CloudFront invalidations, the resource has to be '*'
      });

      // Add this policy to the Lambda's role
      setVideoMetaFn.addToRolePolicy(cloudfrontInvalidationPolicy);
      setVideoMetaFn.addEnvironment('DISTRIBUTION_ID', videoStorage.distribution.distributionId);

      // Store the API endpoint URL for reference
      this.apiEndpoint = api.url;

      // Outputs
      new CfnOutput(this, `${Config.appName}-video-s3-url`, {
        value: videoStorage.s3.bucketWebsiteUrl,
      });

      new CfnOutput(this, `${Config.appName}-api-url`, {
        value: api.url,
      });

      new CfnOutput(this, `${Config.appName}-distribution-domain`, {
        value: videoStorage.distribution.domainName,
      });

      new CfnOutput(this, `${Config.appName}-distribution-id`, {
        value: videoStorage.distribution.distributionId,
      });
    }
}
