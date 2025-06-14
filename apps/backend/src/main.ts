import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { configureSwagger } from "./swagger/configure";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: '*',
    allowedHeaders: 'Content-Type,Authorization,X-Forwarded-For,X-Forwarded-Proto,X-Forwarded-Port,CloudFront-Viewer-Country,CloudFront-Is-Desktop-Viewer,CloudFront-Is-Mobile-Viewer,CloudFront-Is-SmartTV-Viewer,CloudFront-Is-Tablet-Viewer,CloudFront-Viewer-City,CloudFront-Viewer-Country-Name,CloudFront-Viewer-Country-Region,CloudFront-Viewer-Latitude,CloudFront-Viewer-Longitude,CloudFront-Viewer-Metro-Code,CloudFront-Viewer-Time-Zone,CloudFront-Viewer-TLS',
    exposedHeaders: 'Content-Type,Authorization,X-Forwarded-For,X-Forwarded-Proto,X-Forwarded-Port',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe());
  configureSwagger(app);

  // Add a health check endpoint for the load balancer
  app.getHttpAdapter().get('/health', (req: any, res: any) => {
    res.status(200).send('OK');
  });

	await app.listen(Number.parseInt(config.get('PORT') || '3000'));
}

process.on('uncaughtException', (error: unknown) => {
  console.error('Uncaught Exception:', error);
});

bootstrap().catch((error: unknown) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
