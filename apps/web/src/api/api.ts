import { config } from "../config";
import type { Video } from "../models/video";
import type { Paginated, UserInfo, VideoCommentDto, VideoDto } from "./types";

/**
 * This file contains API functions for interacting with the backend services.
 */
// export const videoGeneratePresignedUrl = async (
// 	id: string,
// 	videoUrl: string,
// ): Promise<string> => {
// 	const url = `${config.apiUrl}/videos/${id}/presigned-url`;

// 	const response = await fetch(url, {
// 		method: "POST",
// 		headers: { "Content-Type": "application/json" },
// 		body: JSON.stringify({ url: videoUrl }),
// 	});

// 	if (!response.ok) {
// 		if (response.headers.get("Content-Type")?.includes("application/json")) {
// 			const errorData: { message?: string } = await response.json();
// 			throw new Error(errorData?.message || "Failed to generate presigned URL");
// 		}
// 		throw new Error("Failed to generate presigned URL");
// 	}

// 	const data = await response.json();
// 	return data.signedUrl;
// };

type VideoGeneratePresignedUrlParams = {
  videoId: string;
  videoUrl: string;
  userId: string;
};

export const videoGeneratePresignedUrl = async ({
  videoId,
  videoUrl,
  userId
}: VideoGeneratePresignedUrlParams): Promise<string> => {
	const url = `${config.userApiUrl}/v1/videos/${videoId}/signed-url`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"X-Api-Token": userId,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ url: videoUrl }),
	});

	if (!response.ok) {
		if (response.headers.get("Content-Type")?.includes("application/json")) {
			const errorData: { message?: string } = await response.json();
			throw new Error(errorData?.message || "Failed to generate presigned URL");
		}
		throw new Error("Failed to generate presigned URL");
	}

	const data = await response.json();
	return data.signedUrl;
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

type GetVideosParams = {
	userId: string;
	searchTerm?: string;
	take?: number;
	skip?: number;
};

export const getVideos = async (
	params: GetVideosParams,
): Promise<Paginated<VideoDto>> => {
	const url = new URL(`${config.userApiUrl}/v1/videos`);
	if (params.searchTerm) {
		url.searchParams.append("searchTerm", params.searchTerm);
	}

	const response = await fetch(url, {
		method: "GET",
		headers: {
			"X-Api-Token": params.userId,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch videos: ${response.statusText}`);
	}

	return await response.json();
};

export const signIn = async (username: string): Promise<UserInfo> => {
	const response = await fetch(`${config.userApiUrl}/v1/auth/sign-in`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username }),
	});

	if (!response.ok) {
		throw new Error(`Failed to sign in: ${response.statusText}`);
	}

	return await response.json();
};

export const getVideoComments = async (
	user: UserInfo,
	videoId: string,
): Promise<Paginated<VideoCommentDto>> => {
	const response = await fetch(
		`${config.userApiUrl}/v1/videos/${videoId}/comments`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"X-Api-Token": user.userId,
			},
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to fetch comments for video ${videoId}: ${response.statusText}`,
		);
	}

	return await response.json();
};

type CreateVideoCommentParams = {
	user: UserInfo;
	videoId: string;
	comment: string;
};

export const createVideoComment = async (
	params: CreateVideoCommentParams,
): Promise<void> => {
	const { user, videoId, comment } = params;

	const response = await fetch(
		`${config.userApiUrl}/v1/videos/${videoId}/comments`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Api-Token": user.userId,
			},
			body: JSON.stringify({ comment }),
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to create comment for video ${videoId}: ${response.statusText}`,
		);
	}
};

type GetVideoByIdParams = {
  userId: string;
  videoId: string;
};

export const getVideoById = async (params: GetVideoByIdParams): Promise<VideoDto> => {
  const { userId, videoId } = params;

  const response = await fetch(`${config.userApiUrl}/v1/videos/${videoId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Token": userId,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Video not found");
    }
    throw new Error(`Failed to fetch video: ${response.statusText}`);
  }

  return await response.json();
};
