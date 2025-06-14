import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
export const databaseProviders = [
	{
		provide: "DATA_SOURCE",
		inject: [ConfigService],
		useFactory: async (configService: ConfigService) => {
			const dataSource = new DataSource({
				type: "postgres",
				host: configService.getOrThrow("DB_HOST"),
				port: configService.getOrThrow("DB_PORT"),
				username: configService.getOrThrow("DB_USER"),
				password: configService.getOrThrow("DB_PASS"),
				database: configService.getOrThrow("DB_NAME"),
				entities: [__dirname + "/../**/*.entity{.ts,.js}"],
				ssl: true,
			});
			return dataSource.initialize();
		},
	},
];
