export interface VideoDto {
	id: string;
	title: string;
	description: string;
	fileKey: string;
	tags: string[];
	regionsBlocked: string[];
	createdAt: string;
	updatedAt: string;
}
