import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';
import { errorMiddleware } from '../common/middlewares';
import { okResponse } from '../common/responses';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Zod schema for query parameters
const QuerySchema = z.object({
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 100, {
      message: 'limit must be a number between 1 and 100',
    })
    .optional(),
  startFrom: z.string().optional(),
  searchBy: z.string().trim().toLowerCase().optional(),
});

const _handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET',
  };

  const rawParams = event.queryStringParameters || {};

  // Parse and validate query params
  const parsed = QuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: parsed.error.format() }),
    };
  }

  const { limit = 20, startFrom, searchBy } = parsed.data;

  const scanParams: any = {
    TableName: process.env.TABLE_NAME,
    Limit: limit,
  };

  // Pagination token decoding
  if (startFrom) {
    try {
      scanParams.ExclusiveStartKey = JSON.parse(Buffer.from(startFrom, 'base64').toString());
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid pagination token' }),
      };
    }
  }

  const result = await docClient.send(new ScanCommand(scanParams));
  let items = result.Items || [];

  // If searchBy is provided, filter by name, description, or tags (case-insensitive)
  if (searchBy) {
    const keyword = searchBy.toLowerCase();

    items = items.filter((item: any) => {
      const title = item.title?.toLowerCase() || '';
      const desc = item.description?.toLowerCase() || '';
      const tags = (item.tags || []).map((tag: string) => tag.toLowerCase()).join(' ');

      return title.includes(keyword) || desc.includes(keyword) || tags.includes(keyword);
    });
  }

  const nextToken = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
    : null;

  return okResponse({ videos: items, nextToken });
};

export const handler = errorMiddleware(_handler);
