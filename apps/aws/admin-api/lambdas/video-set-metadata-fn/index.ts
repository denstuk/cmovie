import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
	CloudFrontClient,
	CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { errorMiddleware } from "../../common/middlewares";
import { okResponse } from "../../common/responses";
import { PgClient } from "../../services/pg.client";
import { z } from "zod";

// Interface based on the VideoEntity from the backend project
interface Video {
	id: string;
	title: string;
	description: string | null;
	fileKey: string;
	tags: string[];
	regionsBlocked: string[];
	createdAt: Date;
	updatedAt: Date;
}

// Validation schema for the request body
const VideoMetadataSchema = z.object({
	videoId: z.string().uuid({ message: "Video ID must be a valid UUID" }),
	title: z.string().min(1, { message: "Title is required" }),
	description: z.string().optional().nullable(),
	tags: z.array(z.string()).optional().default([]),
	regionsBlocked: z.array(z.string()).optional().default([]),
	fileKey: z.string().optional(),
});

const _handler = async (
	event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
	// Add CORS headers to all responses
	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Content-Type,Authorization",
		"Access-Control-Allow-Methods": "OPTIONS,PUT,GET",
	};

	try {
		// Parse and validate the request body
		const requestBody = JSON.parse(event.body || "{}");
		const parsedBody = VideoMetadataSchema.safeParse(requestBody);

		if (!parsedBody.success) {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({
					error: "Invalid request data",
					details: parsedBody.error.format(),
				}),
			};
		}

		const { videoId, title, description, tags, regionsBlocked, fileKey } =
			parsedBody.data;

		// Check if the video exists
		const existingVideoQuery = `
      SELECT
        id,
        file_key as "fileKey"
      FROM t_video
      WHERE id = $1
    `;

		const existingVideos = await PgClient.query<Video>(existingVideoQuery, [
			videoId,
		]);
		const existingVideo = existingVideos.length > 0 ? existingVideos[0] : null;

		if (!existingVideo && !fileKey) {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({
					error: "Video not found and no fileKey provided",
				}),
			};
		}

		const currentTimestamp = new Date();
		const effectiveFileKey = fileKey || existingVideo?.fileKey || "";

		// Update or insert video metadata in PostgreSQL (upsert)
		const upsertQuery = `
      INSERT INTO t_video (
        id,
        title,
        description,
        file_key,
        tags,
        regions_blocked,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        title = $2,
        description = $3,
        file_key = $4,
        tags = $5,
        regions_blocked = $6,
        updated_at = $7
      RETURNING id
    `;

		const params = [
			videoId,
			title,
			description || "",
			effectiveFileKey,
			tags || [],
			regionsBlocked || [],
			currentTimestamp,
		];

		await PgClient.query(upsertQuery, params);

		// Handle CloudFront cache invalidation
		const distributionId = process.env.DISTRIBUTION_ID;
		if (distributionId && effectiveFileKey) {
			const cloudfrontClient = new CloudFrontClient({ region: "us-east-1" });

			try {
				console.log(
					`Invalidating CloudFront cache for distribution: ${distributionId}`,
				);
				await cloudfrontClient.send(
					new CreateInvalidationCommand({
						DistributionId: distributionId,
						InvalidationBatch: {
							Paths: {
								Quantity: 1,
								Items: [`/${effectiveFileKey}`],
							},
							CallerReference: `invalidate-${videoId}-${Date.now()}`,
						},
					}),
				);
				console.log("Cache invalidation initiated successfully");
			} catch (invalidationError) {
				console.error(
					"Error invalidating CloudFront cache:",
					invalidationError,
				);
				// Continue execution even if invalidation fails
			}
		}

		return okResponse({
			message: "Video metadata updated successfully",
			videoId,
		});
	} catch (error) {
		console.error("Error updating video metadata:", error);
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({
				error: "Failed to update video metadata",
				message: error instanceof Error ? error.message : "Unknown error",
			}),
		};
	}
};

export const handler = errorMiddleware(_handler);
