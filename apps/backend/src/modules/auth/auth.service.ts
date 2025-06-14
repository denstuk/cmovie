import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { SignInDataDto, SignInInputDto } from "./dtos/sign-in.dto";
import { Repository } from "typeorm";
import { UserEntity } from "../../entities/user.entity";

@Injectable()
export class AuthService {
	constructor(
		@Inject("USER_REPOSITORY")
		private userRepository: Repository<UserEntity>,
	) {}

	/**
	 * Simple sign-in simulation. If the user does not exist, it will create a new user
	 * based on the provided username. Access token is simply the user ID.
	 * NOTE: Demo purposes only (Real application should have proper authentication and token management)
	 */
	async signIn({ username }: SignInInputDto): Promise<SignInDataDto> {
		let user = await this.userRepository.findOne({ where: { username } });

		if (!user) {
			user = await this.userRepository.save({
				username,
			});
		}

		return {
			userId: user.id,
			username: user.username,
			accessToken: user.id,
		};
	}
}
