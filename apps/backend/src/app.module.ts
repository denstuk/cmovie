import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { VideoModule } from "./modules/video/video.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AppController } from "./app.controller";
import { LogMiddleware } from "./middlewares/log.middleware";

@Module({
	imports: [ConfigModule.forRoot(), DatabaseModule, AuthModule, VideoModule],
	controllers: [AppController],
})
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(LogMiddleware)
			.forRoutes({ path: "*", method: RequestMethod.ALL });
	}
}
