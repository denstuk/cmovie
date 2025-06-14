export interface Paginated<T> {
	items: T[];
	total: number;
	take: number;
	skip: number;
}

export interface UserInfo {
	userId: string;
	username: string;
}

export interface VideoDto {
	id: string;
	title: string;
	description: string | null;
	fileKey: string;
	tags: string[];
	regionsBlocked: string[];
	createdAt: string;
	updatedAt: string;
}

export type VideoCommentDto = {
	id: string;
	videoId: string;
	userId: string;
	comment: string;
	createdAt: string;
	updatedAt: string;
	user: { id: string; username: string };
};
