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
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53_targets from "aws-cdk-lib/aws-route53-targets";

export type WebDeploymentProps = {
	name: string;
	webBuildPath: string;
	zone?: IHostedZone;
	cert?: ICertificate;
	subDomain?: string;
};

export class WebDeployment extends Construct {
	constructor(scope: Construct, id: string, props: WebDeploymentProps) {
		super(scope, id);

		const { name, webBuildPath, zone, cert, subDomain } = props;
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
				...(zone && cert && subDomain
					? {
							domainNames: [`${subDomain}.${Config.domainName}`],
							certificate: cert,
						}
					: {}),
			},
		);

		if (zone && cert && subDomain) {
			new route53.ARecord(this, `${Config.appName}-ar-${subDomain}`, {
				zone,
				recordName: subDomain,
				target: route53.RecordTarget.fromAlias(
					new route53_targets.CloudFrontTarget(distribution),
				),
			});
		}

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
