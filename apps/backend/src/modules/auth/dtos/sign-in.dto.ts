import { IsOptional, IsString, MinLength } from "class-validator";

export class SignInInputDto {
  @IsString()
  @MinLength(1)
  readonly username: string;
}

export class SignInDataDto {
  readonly userId: string;
  readonly username: string;
  readonly accessToken: string;
}
