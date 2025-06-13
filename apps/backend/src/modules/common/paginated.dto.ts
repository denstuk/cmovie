import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginatedDto<T> {
  @ApiProperty({ isArray: true })
  items: T[];

  @ApiPropertyOptional({
    description: 'Number of items to take',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  take?: number = 10;

  @ApiPropertyOptional({
    description: 'Number of items to skip',
    default: 0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number = 0;

  @ApiProperty({
    description: 'Total number of items',
  })
  @Type(() => Number)
  @IsInt()
  total: number;
}