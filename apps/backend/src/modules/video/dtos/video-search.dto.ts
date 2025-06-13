import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class VideoSearchDto {
  @IsString()
  @IsOptional()
  readonly searchTerm?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  readonly take?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  readonly skip?: number;
}

