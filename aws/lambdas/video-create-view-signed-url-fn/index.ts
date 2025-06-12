import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { errorMiddleware } from "../common/middlewares";
import { okResponse } from "../common/responses";
import { DEFAULT_VIEW_SIGNED_URL_EXPIRATION } from "../common/constants";

const CF_KEY_PAIR_ID = process.env.CF_KEY_PAIR_ID || '';
const CF_PRIVATE_KEY = process.env.CF_PRIVATE_KEY || '';

const _handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const data: { url: string } = JSON.parse(event.body || '{}');

  // TODO: Add Geo-Validation

  const signedUrl = getSignedUrl({
    url: data.url,
    keyPairId: CF_KEY_PAIR_ID,
    privateKey: CF_PRIVATE_KEY,
    dateLessThan: new Date(Date.now() + DEFAULT_VIEW_SIGNED_URL_EXPIRATION),
  });

  return okResponse({ signedUrl });
};

export const handler = errorMiddleware(_handler);
