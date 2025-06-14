#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AwsStack } from "./stack";
import { Config } from "./config";

const app = new cdk.App();
new AwsStack(app, "cmovie-stack", {
	env: { region: Config.awsRegion },
});

cdk.Tags.of(app).add("environment", Config.envName);
cdk.Tags.of(app).add("app", Config.appName);
