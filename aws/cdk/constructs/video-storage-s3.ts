import { CfnOutput, Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as path from 'path';
import { Construct } from "constructs";
import { Config } from "../config";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export class VideoStorageS3 extends Construct {
  readonly s3Bucket: Bucket;
  readonly apiEndpoint: string;
  readonly distribution: cloudfront.Distribution;

    constructor(scope: Construct, id: string) {
      super(scope, id);

      // S3 Bucket for Videos
      this.s3Bucket = new Bucket(this, `${Config.appName}-video-s3`, {
        publicReadAccess: false,
        removalPolicy: RemovalPolicy.DESTROY,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        autoDeleteObjects: true,
        versioned: true,
        cors: [
          {
            allowedMethods: [
              HttpMethods.GET,
              HttpMethods.PUT,
              HttpMethods.POST,
              HttpMethods.HEAD,
            ],
            allowedOrigins: ['*'],
            allowedHeaders: ['*'],
            exposedHeaders: ['ETag'],
          },
        ],
      });

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
          BUCKET_NAME: this.s3Bucket.bucketName,
          DISTRIBUTION_ID: '', // Will be updated after distribution is created
        },
        timeout: Duration.seconds(30),
      });
      this.s3Bucket.grantReadWrite(getPresignedUploadUrlFn); // Grant permissions to read/write to the S3 bucket
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

      // Create API resources and methods
      const videosResource = api.root.addResource('videos');
      const searchResource = videosResource.addResource('search');
      const uploadResource = api.root.addResource('upload');
      const presignedUrlResource = uploadResource.addResource('presigned-url');
      const metadataResource = videosResource.addResource('metadata');
      const videoByIdResource = videosResource.addResource('{id}');

      // Set up API endpoints
      presignedUrlResource.addMethod('POST', getPresignedUploadUrlIntegration); // Generate presigned URL
      metadataResource.addMethod('PUT', setVideoMetaIntegration); // Set video metadata
      searchResource.addMethod('GET', videoSearchIntegration); // Search all videos
      videoByIdResource.addMethod('GET', getVideoByIdIntegration); // Get single video by ID

      // CloudFront Distribution for video content - enhanced for public access
      this.distribution = new cloudfront.Distribution(this, `${Config.appName}-cloudfront`, {
        defaultBehavior: {
          origin: new cloudfront_origins.S3Origin(this.s3Bucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enabled: true,
        httpVersion: cloudfront.HttpVersion.HTTP2,
        defaultRootObject: 'index.html',
        enableIpv6: true,
      });

      // Create an IAM policy that allows the presigned URL Lambda to invalidate CloudFront
      const cloudfrontInvalidationPolicy = new iam.PolicyStatement({
        actions: ['cloudfront:CreateInvalidation'],
        resources: ['*'], // For CloudFront invalidations, the resource has to be '*'
      });

      // Add this policy to the Lambda's role
      setVideoMetaFn.addToRolePolicy(cloudfrontInvalidationPolicy);
      setVideoMetaFn.addEnvironment('DISTRIBUTION_ID', this.distribution.distributionId);

      // Store the API endpoint URL for reference
      this.apiEndpoint = api.url;

      // Outputs
      new CfnOutput(this, `${Config.appName}-video-s3-url`, {
        value: this.s3Bucket.bucketWebsiteUrl,
      });

      new CfnOutput(this, `${Config.appName}-api-url`, {
        value: api.url,
      });

      new CfnOutput(this, `${Config.appName}-distribution-domain`, {
        value: this.distribution.domainName,
      });

      new CfnOutput(this, `${Config.appName}-distribution-id`, {
        value: this.distribution.distributionId,
      });
    }
}
