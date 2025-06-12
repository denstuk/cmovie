import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebDeployment } from './constructs/web-deployment';
import { Config } from './config';
import { VideoApi } from './constructs/video-api';
import { VideoStorage } from './constructs/video-storage';

export class AwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO: Use a custom VPC later (default VPC is sufficient for now)
    new cdk.aws_ec2.Vpc(this, `${Config.appName}-vpc`, {
      maxAzs: 2,
    });

    const videoStorage = new VideoStorage(this, `${Config.appName}-video-storage`);

    new VideoApi(this, `${Config.appName}-video-stream-stack`, {
      videoStorage,
    });

    new WebDeployment(this, `${Config.appName}-web-deployment`);
  }
}
