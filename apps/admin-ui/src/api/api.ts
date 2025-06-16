import { config } from "../config";
import type { Video } from "./types";

export const updateVideoMetadata = async (
	videoId: string,
	metadata: {
		title: string;
		description: string;
		tags: string[];
		regionsBlocked: string[];
	},
): Promise<void> => {
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
			regionsBlocked: metadata.regionsBlocked,
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
