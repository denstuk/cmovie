import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignInDataDto, SignInInputDto } from "./dtos/sign-in.dto";

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) {}

  @Post('sign-in')
  async signIn(@Body() body: SignInInputDto): Promise<SignInDataDto> {
    return this.authService.signIn(body);
  }
}
