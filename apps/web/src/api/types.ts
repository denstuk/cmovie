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

export interface Video {
	id: string;
	title: string;
	description: string | null;
	fileKey: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export type VideoComment = {
	id: string;
	videoId: string;
	userId: string;
	comment: string;
	createdAt: string;
	updatedAt: string;
	user: { id: string; username: string };
};
