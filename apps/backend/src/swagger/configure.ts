import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export const configureSwagger = (app: INestApplication) => {
	const config = new DocumentBuilder()
		.setTitle("User API")
		.setDescription("User API description")
		.setVersion("1.0")
		.build();

	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("swagger", app, documentFactory);
};
