import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { errorResponse } from "./responses";

type LambdaFn = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export function errorMiddleware(fn: LambdaFn): LambdaFn {
	return async (
		event: APIGatewayProxyEvent,
	): Promise<APIGatewayProxyResult> => {
		try {
			return await fn(event);
		} catch (error) {
			console.error("Error in Lambda function:", error);
			return errorResponse("Internal Server Error");
		}
	};
}
