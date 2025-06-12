import { config } from "../config";
import type { Video } from "../models/video";

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


export const searchVideos = async (searchBy: string): Promise<{
  videos: Video[];
  nextToken?: string;
}> => {
  const url = new URL(`${config.apiUrl}/videos/search`);
  if (searchBy) {
    url.searchParams.append('searchBy', searchBy);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to search videos: ${response.statusText}`);
  }

  return await response.json();
}
