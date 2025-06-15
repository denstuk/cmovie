import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "./env";
import { formatAsPemKey } from "./utils";

export class Config {
  static readonly project = "cmovie";
  static readonly account = env.AWS_ACCOUNT_ID;
	static readonly awsRegion = env.AWS_REGION;
	static readonly envName = env.ENVIRONMENT;
	static readonly appName = `${Config.project}-${Config.envName}`;
	static readonly domainName = env.DOMAIN_NAME;
  static readonly certArn = env.CERTIFICATE_ARN;
	static readonly webBuildPath = "../web/dist";
	static readonly adminUiBuildPath = "../admin-ui/dist";
	static readonly backendPath = join(__dirname, "../../../backend");

	static get cloudFrontPublicKey(): string {
		const base64 = readFileSync(
			join(__dirname, env.CF_PUBLIC_KEY_PATH),
			"utf-8",
		);
		return formatAsPemKey(base64);
	}

	static get cloudFrontPrivateKey(): string {
		return readFileSync(join(__dirname, env.CF_PRIVATE_KEY_PATH), "utf-8");
	}

	static get cloudFrontAuthHeaderValue(): string {
		// Generate a consistent but unique value for the CloudFront auth header
		return `${Config.appName}-cf-auth-${Config.envName}-${Date.now().toString(36)}`;
	}
}
