import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

type LambdaFn = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export function errorMiddleware(fn: LambdaFn): LambdaFn {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      return await fn(event);
    } catch (error) {
      console.error("Error in Lambda function:", error);
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Access-Control-Allow-Methods": "OPTIONS,POST,PUT,GET",
        },
        body: JSON.stringify({ error: "Internal Server Error" }),
      };
    }
  };
}
