import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebDeployment } from './constructs/web-deployment';
import { Config } from './config';
import { VideoStorageS3 } from './constructs/video-storage-s3';

export class AwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new VideoStorageS3(this, `${Config.appName}-video-storage-s3`);
    new WebDeployment(this, `${Config.appName}-web-deployment`);
  }
}
