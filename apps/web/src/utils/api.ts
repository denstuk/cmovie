import { config } from '../config';

/**
 * Helper function to ensure API requests are made through CloudFront
 * when the CloudFront domain is available
 */
export function getApiUrl(path: string): string {
  const baseUrl = config.cloudfrontDomain || config.apiUrl;
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}
