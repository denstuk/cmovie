import { BlockPublicAccess, Bucket, BucketEncryption, EventType, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { Config } from "../config";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class VideoStorage extends Construct {
  readonly s3Temp: Bucket; // Bucket for temporary video uploads
  readonly s3: Bucket;
  readonly distribution: cloudfront.Distribution;
  readonly key: cloudfront.PublicKey;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // S3 Bucket for Temporary Videos (Uploads)
    this.s3Temp = new Bucket(this, `${Config.appName}-video-temp-storage-s3`, {
      bucketName: `${Config.appName}-video-temp-videos`,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      versioned: false,
      lifecycleRules: [
        {
          enabled: true,
          // Temporary files expire after 1 day
          expiration: Duration.days(1),
        },
      ],
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });

    // S3 Bucket for Videos
    // TODO:denstuk - Review security settings
    this.s3 = new Bucket(this, `${Config.appName}-video-storage-s3`, {
      bucketName: `${Config.appName}-videos`,
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

    const uploadProcessorLambda = new nodejs.NodejsFunction(this, `${Config.appName}-on-video-upload-processor-fn`, {
      functionName: `${Config.appName}-on-video-upload-processor-fn`,
      description: 'Lambda function to process video uploads',
      entry: 'admin-api/lambdas/on-video-upload-processor-fn/index.ts',
      handler: 'handler',
      logRetention: RetentionDays.ONE_DAY,
      timeout: Duration.seconds(2),
      environment: {
        TEMPORARY_BUCKET: this.s3Temp.bucketName,
        DESTINATION_BUCKET: this.s3.bucketName,
      },
    });

    this.s3Temp.grantReadWrite(uploadProcessorLambda);
    this.s3Temp.grantDelete(uploadProcessorLambda);
    this.s3.grantReadWrite(uploadProcessorLambda);

    uploadProcessorLambda.addEventSource(
      new S3EventSource(this.s3Temp, {
        events: [EventType.OBJECT_CREATED],
      })
    );

    this.key = new cloudfront.PublicKey(this, `${Config.appName}-video-distribution-pub-key`, {
      encodedKey: Config.cloudFrontPublicKey,
      comment: 'CloudFront Key for signed URLs',
    });

    const keyGroup = new cloudfront.KeyGroup(this, `${Config.appName}-video-distribution-group-key`, {
      items: [this.key],
      comment: 'Key group for trusted signers',
    });

    // CloudFront Distribution for S3 Bucket
    this.distribution = new cloudfront.Distribution(this, `${Config.appName}-video-distribution`, {
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(this.s3),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        trustedKeyGroups: [keyGroup],
      },
      comment: `${Config.appName} - Video Distribution`,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      defaultRootObject: 'index.html',
      enableIpv6: true,
    });
  }
}
