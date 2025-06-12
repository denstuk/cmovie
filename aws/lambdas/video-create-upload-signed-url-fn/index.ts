import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: 'us-east-1' });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Add CORS headers to all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
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
    // Generate presigned URL for video upload
    if (event.httpMethod === 'POST') {
      const requestBody = JSON.parse(event.body || '{}');
      const { fileType, fileName } = requestBody;

      if (!fileType || !fileName) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing fileType or fileName' }),
        };
      }

      // Generate unique ID for the video
      const videoId = uuidv4();
      const fileKey = `videos/${videoId}/${fileName}`;

      // Create presigned URL for file upload
      const presignedUrl = await getSignedUrl(
        s3Client,
        new PutObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: fileKey,
          ContentType: fileType,
        }),
        { expiresIn: 3600 } // URL expires in 1 hour
      );

      // If a distribution ID is available, include it in the response
      // The actual invalidation should be done after the file is uploaded using the invalidate-cache endpoint
      let invalidationInfo = null;
      if (process.env.DISTRIBUTION_ID && requestBody.invalidateCache) {
        invalidationInfo = {
          distributionId: process.env.DISTRIBUTION_ID,
          paths: [`/${fileKey}`],
          message: 'After successful upload, call the /invalidate endpoint to update CloudFront cache'
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          videoId,
          fileKey,
          presignedUrl,
          invalidationInfo: invalidationInfo
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
