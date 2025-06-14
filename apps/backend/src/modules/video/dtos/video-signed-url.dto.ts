import { ApiProperty } from "@nestjs/swagger";

export class VideoSignedUrlGenerateDto {
	readonly url: string;
}

export class VideoSignedUrlDto {
	@ApiProperty({
		description: "The signed URL for the video file",
		example:
			"https://example-bucket.s3.amazonaws.com/video.mp4?AWSAccessKeyId=AKIA...&Expires=1234567890&Signature=abc123",
	})
	readonly signedUrl: string;
}
