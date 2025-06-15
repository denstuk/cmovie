import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { errorMiddleware } from "../../common/middlewares";
import { okResponse } from "../../common/responses";
import { DEFAULT_UPLOAD_SIGNED_URL_EXPIRATION } from "../../common/constants";

const s3Client = new S3Client({ region: "us-east-1" });

const _handler = async (
	event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Content-Type,Authorization",
		"Access-Control-Allow-Methods": "OPTIONS,POST",
	};

	const requestBody = JSON.parse(event.body || "{}");
	const { fileType, fileName } = requestBody;

	if (!fileType || !fileName) {
		return {
			statusCode: 400,
			headers,
			body: JSON.stringify({ error: "Missing fileType or fileName" }),
		};
	}

	// Generate unique ID for the video
	const videoId = uuidv4();
	const fileKey = `videos/${videoId}/video`;

	// Create presigned URL for file upload
	const presignedUrl = await getSignedUrl(
		s3Client,
		new PutObjectCommand({
			Bucket: process.env.BUCKET_NAME,
			Key: fileKey,
			ContentType: fileType,
		}),
		{ expiresIn: DEFAULT_UPLOAD_SIGNED_URL_EXPIRATION },
	);

	return okResponse({
		videoId,
		fileKey,
		presignedUrl,
	});
};

export const handler = errorMiddleware(_handler);
