import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe, VersioningType } from "@nestjs/common";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe());

	await app.listen(Number.parseInt(config.get('PORT') || '3000'));
}

process.on('uncaughtException', (error: unknown) => {
  console.error('Uncaught Exception:', error);
});

bootstrap().catch((error: unknown) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
