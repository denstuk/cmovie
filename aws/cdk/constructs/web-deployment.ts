import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { Config } from "../config";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { AllowedMethods, Distribution, OriginAccessIdentity, PriceClass, SecurityPolicyProtocol, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";

export class WebDeployment extends Construct {
    constructor(scope: Construct, id: string) {
      super(scope, id);

      const s3Bucket = new Bucket(this, `${Config.appName}-web-s3`, {
        publicReadAccess: false,
        removalPolicy: RemovalPolicy.DESTROY,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        autoDeleteObjects: true,
      });

      const oai = new OriginAccessIdentity(this, `${Config.appName}-oai`);
      s3Bucket.grantRead(oai);

      const distribution = new Distribution(this, `${Config.appName}-cloudfront-distribution`, {
        defaultRootObject: 'index.html',
        minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
        defaultBehavior: {
          origin: new S3Origin(s3Bucket, {
            originAccessIdentity: oai,
          }),
          compress: true,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: ViewerProtocolPolicy.ALLOW_ALL,
        },
        priceClass: PriceClass.PRICE_CLASS_100,
      });

      new BucketDeployment(this, `${Config.appName}-s3-deployment`, {
        sources: [Source.asset(Config.webBuildPath)],
        destinationBucket: s3Bucket,
        distribution,
        distributionPaths: ['/*'],
      });

      new CfnOutput(this, `${Config.appName}-s3-url`, {
        value: s3Bucket.bucketWebsiteUrl,
      });
      new CfnOutput(this, `${Config.appName}-distribution-name`, {
        value: distribution.distributionDomainName,
      });
    }
}
