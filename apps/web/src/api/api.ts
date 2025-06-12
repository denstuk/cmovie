import { config } from "../config";

/**
 * This file contains API functions for interacting with the backend services.
 */
export const videoGeneratePresignedUrl = async (id: string, videoUrl: string): Promise<string> => {
  const url = `${config.apiUrl}/videos/${id}/presigned-url`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: videoUrl }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate presigned URL: ${response.statusText}`);
  }

  const data = await response.json();
  return data.signedUrl;
}
