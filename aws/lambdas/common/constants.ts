// TODO: Review from security standpoint
export const DEFAULT_CORS_CONFIG: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE'
};

export const DEFAULT_VIEW_SIGNED_URL_EXPIRATION = 3600 * 1000 * 5; // 5 hours
export const DEFAULT_UPLOAD_SIGNED_URL_EXPIRATION = 3600; // 1 hour
