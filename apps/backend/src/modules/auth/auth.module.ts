import { Module } from "@nestjs/common";
import { DataSource } from "typeorm";
import { UserEntity } from "../../entities/user.entity";
import { AuthController } from "./auth.controller";
import { DatabaseModule } from "../../database/database.module";
import { AuthService } from "./auth.service";

@Module({
	imports: [DatabaseModule],
	controllers: [AuthController],
	providers: [
		{
			provide: "USER_REPOSITORY",
			useFactory: (dataSource: DataSource) =>
				dataSource.getRepository(UserEntity),
			inject: ["DATA_SOURCE"],
		},
		AuthService,
	],
})
export class AuthModule {}
