import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Config } from "../config";
import { FargateService } from "../constructs/fargate-service";

type UserApiComponentProps = {
  vpc: Vpc;
}

export class UserApiComponent extends Construct {
  constructor(scope: Construct, id: string, props: UserApiComponentProps) {
    super(scope, id);
    const { vpc } = props;

    new FargateService(this, `${Config.appName}-backend`, {
      vpc,
      imagePath: Config.backendPath,
      containerPort: 3000,
      environment: {
        "DB_HOST": process.env.USER_API_DB_HOST as string,
        "DB_PORT": process.env.USER_API_DB_PORT as string,
        "DB_USER": process.env.USER_API_DB_USER as string,
        "DB_PASS": process.env.USER_API_DB_PASS as string,
        "DB_NAME": process.env.USER_API_DB_NAME as string,
      },
    });
  }
}
