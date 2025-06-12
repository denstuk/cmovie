import { DEFAULT_CORS_CONFIG } from "./constants";

export const okResponse = <T>(data: T): { statusCode: number; body: string; headers: Record<string, string> } => {
  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: { ...DEFAULT_CORS_CONFIG }
  };
};

export const errorResponse = (message: string, statusCode: number = 500): { statusCode: number; body: string; headers: Record<string, string> } => {
  return {
    statusCode,
    body: JSON.stringify({ error: message }),
    headers: { ...DEFAULT_CORS_CONFIG }
  };
};
