import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { errorMiddleware } from "../../common/middlewares";
import { notFoundResponse, okResponse } from "../../common/responses";
import { COUNTRY_CODES, DEFAULT_CORS_CONFIG, DEFAULT_VIEW_SIGNED_URL_EXPIRATION } from "../../common/constants";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Video } from "../../common/models/video";

const CF_KEY_PAIR_ID = process.env.CF_KEY_PAIR_ID || '';
const CF_PRIVATE_KEY = process.env.CF_PRIVATE_KEY || '';
const TABLE_NAME = process.env.TABLE_NAME || '';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const _handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  const data: { url: string } = JSON.parse(event.body || '{}');
  const params = event.pathParameters as { id: string };

  const response = await docClient.send(
    new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: { video_id: params.id },
    })
  );

  if (!response.Item) {
    return notFoundResponse(`Video with ID ${params.id} not found`);
  }

  const video = response.Item as Video;
  const blockedCountryCodes = new Set((video.regions_blacklist || []).map((country: string) => COUNTRY_CODES[country]));

  console.log(video.regions_blacklist);

  // TODO: Add Geo-Validation
  const countryCode = event.headers["cloudfront-viewer-country"] || event.headers["CloudFront-Viewer-Country"];
  console.log(`Country code: ${countryCode}`);

  if (countryCode && blockedCountryCodes.has(countryCode)) {
    return {
      statusCode: 403,
      headers: {
        ...DEFAULT_CORS_CONFIG,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: 'Access denied from your region' }),
    };
  }

  const signedUrl = getSignedUrl({
    url: data.url,
    keyPairId: CF_KEY_PAIR_ID,
    privateKey: CF_PRIVATE_KEY,
    dateLessThan: new Date(Date.now() + DEFAULT_VIEW_SIGNED_URL_EXPIRATION),
  });

  return okResponse({ signedUrl });
};

export const handler = errorMiddleware(_handler);
