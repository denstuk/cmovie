export const config = {
	apiUrl: import.meta.env.VITE_API_URL as string,
	userApiUrl: import.meta.env.VITE_USER_API_URL as string,
	cloudfrontDomain: import.meta.env.VITE_CLOUDFRONT_DOMAIN as string,
} as const;
