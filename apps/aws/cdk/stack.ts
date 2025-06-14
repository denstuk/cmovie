import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { WebDeployment } from "./constructs/web-deployment";
import { Config } from "./config";
import { AdminApiComponent } from "./components/admin-api.component";
import { VideoStorage } from "./constructs/video-storage";
import { UserApiComponent } from "./components/user-api.component";

export class AwsStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const vpc = new cdk.aws_ec2.Vpc(this, `${Config.appName}-vpc`, {
			maxAzs: 2,
		});

		const videoStorage = new VideoStorage(
			this,
			`${Config.appName}-video-storage`,
		);

		new UserApiComponent(this, `${Config.appName}-user-api`, {
			vpc,
			videoStorage,
		});

		new AdminApiComponent(this, `${Config.appName}-video-stream-stack`, {
			videoStorage,
		});

		new WebDeployment(this, `${Config.appName}-web-deployment`, {
			name: "web",
			webBuildPath: Config.webBuildPath,
		});

		new WebDeployment(this, `${Config.appName}-admin-ui-deployment`, {
			name: "admin-ui",
			webBuildPath: Config.adminUiBuildPath,
		});
	}
}
