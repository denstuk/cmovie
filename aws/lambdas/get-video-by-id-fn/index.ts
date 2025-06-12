import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Add CORS headers to all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET'
  };

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS enabled' }),
    };
  }

  try {
    // Get single video by ID
    if (event.httpMethod === 'GET') {
      // Extract videoId from path parameters
      const videoId = event.pathParameters?.id;

      if (!videoId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing video ID' }),
        };
      }

      // Fetch the video from DynamoDB
      const result = await docClient.send(
        new GetCommand({
          TableName: process.env.TABLE_NAME,
          Key: { video_id: videoId },
        })
      );

      // Check if video was found
      if (!result.Item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Video not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          video: result.Item,
        }),
      };
    }

    // Default response for undefined routes
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Error processing request:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
