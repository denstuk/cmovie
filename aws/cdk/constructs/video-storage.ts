import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from "constructs";
import { Config } from "../config";
import { RemovalPolicy } from "aws-cdk-lib";
import { readFileSync } from "fs";
import { join } from "path";

export class VideoStorage extends Construct {
  readonly s3: Bucket;
  readonly distribution: cloudfront.Distribution;
  readonly key: cloudfront.PublicKey;

  constructor(scope: Construct, id: string) {
    super(scope, id);

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
