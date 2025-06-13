import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { VideoModule } from "./modules/video/video.module";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
	imports: [ConfigModule.forRoot(), DatabaseModule, AuthModule, VideoModule],
})
export class AppModule {}
