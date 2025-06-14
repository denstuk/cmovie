import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { VideoModule } from "./modules/video/video.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AppController } from "./app.controller";
import { CloudFrontVerificationMiddleware } from "./middlewares/cloudfront-verification.middleware";

@Module({
	imports: [ConfigModule.forRoot(), DatabaseModule, AuthModule, VideoModule],
	controllers: [AppController],
})
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		// Apply the CloudFront verification middleware to all routes
		consumer
			.apply(CloudFrontVerificationMiddleware)
			.forRoutes({ path: "*", method: RequestMethod.ALL });
	}
}
