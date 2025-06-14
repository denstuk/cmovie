import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignInDataDto, SignInInputDto } from "./dtos/sign-in.dto";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("sign-in")
	@ApiOperation({
		summary: "Sign In",
		description:
			"Simulation of a sign-in endpoint that returns a token and user information.",
	})
	@ApiOkResponse({
		description: "Successful sign-in response",
		type: SignInDataDto,
	})
	async signIn(@Body() body: SignInInputDto): Promise<SignInDataDto> {
		return this.authService.signIn(body);
	}
}
