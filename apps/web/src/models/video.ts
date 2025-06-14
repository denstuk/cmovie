export interface Video {
	video_id: string;
	title: string;
	description: string;
	file_key: string;
	upload_date: string;
	tags: string[];
	regions_blacklist: string[];
}

export interface VideoV2 {
	id: string;
	title: string;
	description: string;
	fileKey: string;
	tags: string[];
	regionsBlacklist: string[];
	createdAt: string;
	updatedAt: string;
}
