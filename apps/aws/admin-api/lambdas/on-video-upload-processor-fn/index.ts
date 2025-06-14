import { S3Event, S3Handler } from "aws-lambda";
import {
	S3Client,
	GetObjectCommand,
	CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { convertMedia } from "../../services/media-convert.service";

const s3Client = new S3Client({ region: "us-east-1" });

const _handler: S3Handler = async (event: S3Event) => {
	const tempBucket = process.env.TEMPORARY_BUCKET as string;
	const destBucket = process.env.DESTINATION_BUCKET as string;

	for (const record of event.Records) {
		const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
		const size = record.s3.object.size;

		console.log(`New file uploaded: ${key}, size: ${size} bytes`);

		// Validate file exists
		const getObject = await s3Client.send(
			new GetObjectCommand({
				Bucket: tempBucket,
				Key: key,
			}),
		);

		const contentType = getObject.ContentType || "";
		console.log(`File content type: ${contentType}`);

		// Basic validation: must be video
		if (!contentType.startsWith("video/")) {
			console.warn(`Skipping non-video file: ${key}`);
			continue;
		}

    const [p1, p2] = key.split('/');

		// Copy to final destination bucket
		await s3Client.send(
			new CopyObjectCommand({
				Bucket: destBucket,
				Key: [p1, p2, 'video'].join('/'),
				CopySource: `${tempBucket}/${key}`,
				ContentType: contentType,
			}),
		);

    await convertMedia({
      tempKey: key,
      tempBucket: tempBucket,
      destKey: [p1, p2].join('/'),
      destBucket: destBucket,
      roleArn: process.env.MEDIA_CONVERT_ROLE_ARN as string,
    });
	}
};

export const handler = _handler;
