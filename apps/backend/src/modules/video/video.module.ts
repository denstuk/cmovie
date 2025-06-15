import { Module } from "@nestjs/common";
import { VideoService } from "./video.service";
import { VideoController } from "./video.controller";
import { DatabaseModule } from "../../database/database.module";
import {
	USER_REPO_PROVIDER,
	VIDEO_COMMENT_REPO_PROVIDER,
	VIDEO_REPO_PROVIDER,
} from "../../database/database.repos";
import { ConfigModule } from "@nestjs/config";
import { AwsModule } from "../aws/aws.module";

@Module({
	imports: [DatabaseModule, ConfigModule, AwsModule],
	controllers: [VideoController],
	providers: [
		VIDEO_REPO_PROVIDER,
		VIDEO_COMMENT_REPO_PROVIDER,
		USER_REPO_PROVIDER,
		VideoService,
	],
	exports: [],
})
export class VideoModule {}
