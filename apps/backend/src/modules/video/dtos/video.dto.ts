import { ApiProperty } from "@nestjs/swagger";

export class VideoDto {
	@ApiProperty({ description: 'Unique identifier of the video' })
  readonly id: string;

  @ApiProperty({ description: 'Title of the video' })
  readonly title: string;

  @ApiProperty({ description: 'Detailed description of the video content' })
  readonly description: string;

  @ApiProperty({ description: 'File key for video storage location' })
  readonly fileKey: string;

  @ApiProperty({ description: 'Array of tags associated with the video' })
  readonly tags: string[];

  @ApiProperty({ description: 'Timestamp when video was created' })
  readonly createdAt: Date;

  @ApiProperty({ description: 'Timestamp of last video update' })
  readonly updatedAt: Date;
}
