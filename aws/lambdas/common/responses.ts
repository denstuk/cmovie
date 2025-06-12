// Add CORS headers to all responses (TODO: Review from security perspective)
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
};

export const okResponse = <T>(data: T): { statusCode: number; body: string; headers: Record<string, string> } => {
  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers,
  };
};
