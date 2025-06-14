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

@Module({
	imports: [DatabaseModule, ConfigModule],
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
