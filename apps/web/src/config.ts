export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  cloudfrontDomain: import.meta.env.VITE_CLOUDFRONT_DOMAIN || 'your-cloudfront-domain.cloudfront.net',
} as const;
