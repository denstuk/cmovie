import { CfnOutput, Duration } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import { Config } from "../common/config";

type FargateServiceProps = {
	vpc: ec2.Vpc;
	imagePath: string;
	containerPort: number;
	environment: Record<string, string>;
	cloudfrontHeaderValue?: string;
};

export class FargateService extends Construct {
	public readonly cloudFrontDistribution: cloudfront.Distribution;

	constructor(scope: Construct, id: string, props: FargateServiceProps) {
		super(scope, id);

		const {
			imagePath,
			containerPort,
			environment,
			vpc,
			cloudfrontHeaderValue = "CloudFront-Secret-Header-Value",
		} = props;

		// Create ECS Cluster
		const cluster = new ecs.Cluster(this, `${Config.appName}-cluster`, { vpc });

		// Create Fargate Service with ALB
		const fargateService =
			new ecs_patterns.ApplicationLoadBalancedFargateService(
				this,
				`${Config.appName}-fargate`,
				{
					cluster: cluster,
					taskImageOptions: {
						image: ecs.ContainerImage.fromAsset(imagePath),
						containerPort,
						containerName: Config.appName,
						environment,
					},
					publicLoadBalancer: true,
				},
			);

		// Configure ALB to forward CloudFront headers to the Fargate container
		if (fargateService.targetGroup instanceof elbv2.ApplicationTargetGroup) {
			fargateService.targetGroup.configureHealthCheck({
				path: "/",
				healthyHttpCodes: "200",
			});
		}

		// Create a custom header for CloudFront to ALB authentication
		const cfAuthHeaderName = "X-CloudFront-Auth";

		// Add a listener rule to the ALB that only allows traffic with the custom header
		new elbv2.ApplicationListenerRule(this, `${Config.appName}-alb-rule`, {
			listener: fargateService.listener,
			priority: 10,
			conditions: [
				elbv2.ListenerCondition.httpHeader(cfAuthHeaderName, [
					cloudfrontHeaderValue,
				]),
			],
			action: elbv2.ListenerAction.forward([fargateService.targetGroup]),
		});

		// Default action for the listener is to return 403 Forbidden
		new elbv2.ApplicationListenerRule(
			this,
			`${Config.appName}-default-deny-rule`,
			{
				listener: fargateService.listener,
				priority: 20,
				conditions: [elbv2.ListenerCondition.pathPatterns(["/*"])],
				action: elbv2.ListenerAction.fixedResponse(403, {
					contentType: "text/plain",
					messageBody: "Direct access to this load balancer is not allowed.",
				}),
			},
		);

		// Create CloudFront distribution with the ALB as the origin
		this.cloudFrontDistribution = new cloudfront.Distribution(
			this,
			`${Config.appName}-cf-distribution`,
			{
				defaultBehavior: {
					origin: new origins.LoadBalancerV2Origin(
						fargateService.loadBalancer,
						{
							// Add the custom header to authenticate with the ALB
							customHeaders: { [cfAuthHeaderName]: cloudfrontHeaderValue },
							protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
						},
					),
					// Configure CloudFront to forward all headers to the origin
					originRequestPolicy: new cloudfront.OriginRequestPolicy(
						this,
						`${Config.appName}-req-policy`,
						{
							headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
								"CloudFront-Viewer-Country",
								"CloudFront-Viewer-City",
								"X-Api-Token",
							),
							cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
							queryStringBehavior:
								cloudfront.OriginRequestQueryStringBehavior.all(),
						},
					),
					cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
					allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
					viewerProtocolPolicy:
						cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				},
			},
		);

		// Outputs
		new CfnOutput(this, `${Config.appName}-load-balancer-url`, {
			value: fargateService.loadBalancer.loadBalancerDnsName,
			description: "The URL of the load balancer (internal use only)",
		});
		new CfnOutput(this, `${Config.appName}-cloudfront-url`, {
			value: this.cloudFrontDistribution.distributionDomainName,
			description: "The CloudFront distribution domain name (public access)",
		});
	}
}
