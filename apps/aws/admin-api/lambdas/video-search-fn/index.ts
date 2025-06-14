import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { errorMiddleware } from "../../common/middlewares";
import { okResponse } from "../../common/responses";
import { PgClient } from "../../services/pg.client";

// Interface based on the VideoEntity from the backend project
interface Video {
	id: string;
	title: string;
	description: string | null;
	fileKey: string;
	tags: string[];
	regionsBlocked: string[];
	createdAt: string;
	updatedAt: string;
}

const _handler = async (
	event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
	const query = `
    SELECT
      id,
      title,
      description,
      file_key as "fileKey",
      tags,
      regions_blocked as "regionsBlocked",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM t_video
    ORDER BY created_at DESC
    LIMIT $1
  `;

	// TODO: Hardcode limit for simplicity
	const videos = await PgClient.query<Video>(query, [100]);
	return okResponse({ videos });
};

export const handler = errorMiddleware(_handler);
