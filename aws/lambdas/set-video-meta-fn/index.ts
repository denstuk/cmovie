import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Add CORS headers to all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET'
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
    // Set video metadata endpoint
    if (event.httpMethod === 'PUT') {
      const requestBody = JSON.parse(event.body || '{}');
      const { videoId, title, description, tags, blockedCountries, fileKey } = requestBody;

      if (!videoId || !title) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      // Get existing video data if it exists (for backward compatibility)
      const existingVideo = await docClient.send(
        new GetCommand({
          TableName: process.env.TABLE_NAME,
          Key: { video_id: videoId },
        })
      );

      const currentTimestamp = new Date().toISOString();

      // Prepare video metadata - directly set values from the request or use defaults
      const videoData = {
        video_id: videoId,
        title,
        description: description || '',
        file_key: fileKey || (existingVideo.Item?.file_key || ''),
        upload_date: existingVideo.Item?.upload_date || currentTimestamp,
        update_date: currentTimestamp,
        tags: tags || [],
        regions_blacklist: blockedCountries || [],
      };

      // Set metadata in DynamoDB
      await docClient.send(
        new PutCommand({
          TableName: process.env.TABLE_NAME,
          Item: videoData,
        })
      );

      const distributionId = process.env.DISTRIBUTION_ID;
      if (distributionId) {
        // Import CloudFront client at the top of the file
        const cloudfrontClient = new CloudFrontClient({ region: 'us-east-1' });

        try {
          // Invalidate CloudFront cache if distribution ID is set
          console.log(`Invalidating CloudFront cache for distribution: ${distributionId}`);
          await cloudfrontClient.send(
        new CreateInvalidationCommand({
          DistributionId: distributionId,
          InvalidationBatch: {
            Paths: {
          Quantity: 1,
          Items: [`/${videoData.file_key}`]
            },
            CallerReference: `invalidate-${videoId}-${Date.now()}`
          }
        })
          );
          console.log('Cache invalidation initiated successfully');
        } catch (invalidationError) {
          console.error('Error invalidating CloudFront cache:', invalidationError);
          // Continue execution even if invalidation fails
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Video metadata set successfully',
          videoId,
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
