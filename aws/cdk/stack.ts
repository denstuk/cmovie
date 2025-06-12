import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebDeployment } from './constructs/web-deployment';
import { Config } from './config';
import { VideoStreamStack } from './constructs/video-stream-stack';

export class AwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new VideoStreamStack(this, `${Config.appName}-video-stream-stack`);
    new WebDeployment(this, `${Config.appName}-web-deployment`);
  }
}
