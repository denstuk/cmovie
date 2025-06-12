import { config } from "../config";
import type { Video } from "../models/video";

/**
 * This file contains API functions for interacting with the backend services.
 */
export const videoGeneratePresignedUrl = async (
	id: string,
	videoUrl: string,
): Promise<string> => {
	const url = `${config.apiUrl}/videos/${id}/presigned-url`;

	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ url: videoUrl }),
	});

	if (!response.ok) {
		throw new Error(`Failed to generate presigned URL: ${response.statusText}`);
	}

	const data = await response.json();
	return data.signedUrl;
};

/**
 * Updates video metadata
 * @param videoId The ID of the video to update
 * @param metadata The metadata to update
 * @returns The updated video
 */
export const updateVideoMetadata = async (
	videoId: string,
	metadata: {
		title: string;
		description: string;
		tags: string[];
		blockedCountries: string[];
	},
): Promise<Video> => {
	const response = await fetch(`${config.apiUrl}/videos/metadata`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			videoId,
			title: metadata.title,
			description: metadata.description,
			tags: metadata.tags,
			blockedCountries: metadata.blockedCountries,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to update video metadata: ${response.statusText}`);
	}

	return await response.json();
};

export const searchVideos = async (
	searchBy: string,
): Promise<{
	videos: Video[];
	nextToken?: string;
}> => {
	const url = new URL(`${config.apiUrl}/videos/search`);
	if (searchBy) {
		url.searchParams.append("searchBy", searchBy);
	}

	const response = await fetch(url.toString(), {
		method: "GET",
		headers: { "Content-Type": "application/json" },
	});

	if (!response.ok) {
		throw new Error(`Failed to search videos: ${response.statusText}`);
	}

	return await response.json();
};
