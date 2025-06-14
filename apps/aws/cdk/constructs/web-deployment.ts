import { CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { Config } from "../common/config";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import {
	AllowedMethods,
	Distribution,
	OriginAccessIdentity,
	PriceClass,
	SecurityPolicyProtocol,
	ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";

export type WebDeploymentProps = {
	name: string;
	webBuildPath: string;
};

export class WebDeployment extends Construct {
	constructor(scope: Construct, id: string, props: WebDeploymentProps) {
		super(scope, id);

		const { name, webBuildPath } = props;
		const prefix = `${Config.appName}-${name}`;

		const s3Bucket = new Bucket(this, `${prefix}-web-s3`, {
			bucketName: `${prefix}-bucket`,
			publicReadAccess: false,
			removalPolicy: RemovalPolicy.DESTROY,
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
			autoDeleteObjects: true,
		});

		const oai = new OriginAccessIdentity(this, `${prefix}-oai`);
		s3Bucket.grantRead(oai);

		const distribution = new Distribution(
			this,
			`${prefix}-cloudfront-distribution`,
			{
				comment: `${prefix} - CloudFront Distribution`,
				defaultRootObject: "index.html",
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
				errorResponses: [
					{
						httpStatus: 404,
						responseHttpStatus: 200,
						responsePagePath: "/index.html",
						ttl: Duration.seconds(0),
					},
				],
			},
		);

		new BucketDeployment(this, `${prefix}-s3-deployment`, {
			sources: [Source.asset(webBuildPath)],
			destinationBucket: s3Bucket,
			distribution,
			distributionPaths: ["/*"],
		});

		new CfnOutput(this, `${prefix}-s3-url`, {
			value: s3Bucket.bucketWebsiteUrl,
		});
		new CfnOutput(this, `${prefix}-distribution-name`, {
			value: distribution.distributionDomainName,
		});
	}
}
