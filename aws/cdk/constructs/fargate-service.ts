import { CfnOutput } from "aws-cdk-lib";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from "constructs";
import { Config } from "../config";

type FargateServiceProps = {
  vpc: ec2.Vpc;
  imagePath: string;
  containerPort: number;
  environment: Record<string, string>;
};

export class FargateService extends Construct {
    constructor(scope: Construct, id: string, props: FargateServiceProps) {
      super(scope, id);

      const { imagePath, containerPort, environment, vpc } = props;

      const cluster = new ecs.Cluster(this, `${Config.appName}-cluster`, { vpc });

      const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, `${Config.appName}-fargate`, {
        cluster: cluster,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset(imagePath),
          containerPort,
          containerName: Config.appName,
          environment,
        },
        publicLoadBalancer: true
      });

      new CfnOutput(this, `${Config.appName}-load-balancer-url`, {
        value: fargateService.loadBalancer.loadBalancerDnsName
      });
    }
}
