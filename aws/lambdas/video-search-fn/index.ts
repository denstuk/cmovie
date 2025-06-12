import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

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
    // Get all videos
    if (event.httpMethod === 'GET') {
      // Extract query parameters for filtering and pagination
      const queryParams = event.queryStringParameters || {};

      const scanParams: any = {
        TableName: process.env.TABLE_NAME,
      };

      // Optional: Add pagination support
      if (queryParams.lastKey) {
        try {
          scanParams.ExclusiveStartKey = JSON.parse(
            Buffer.from(queryParams.lastKey, 'base64').toString()
          );
        } catch (e) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Invalid pagination token',
            }),
          };
        }
      }

      // Optional: Set a limit on number of items returned
      if (queryParams.limit) {
        const limit = parseInt(queryParams.limit, 10);
        if (!isNaN(limit) && limit > 0) {
          scanParams.Limit = Math.min(limit, 100); // Capping at 100 for performance
        }
      }

      // Execute the scan operation
      const result = await docClient.send(new ScanCommand(scanParams));

      // Prepare pagination token if there are more results
      let nextToken = null;
      if (result.LastEvaluatedKey) {
        nextToken = Buffer.from(
          JSON.stringify(result.LastEvaluatedKey)
        ).toString('base64');
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          videos: result.Items,
          nextToken,
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

