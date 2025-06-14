export type Paginated<T> = {
	items: T[];
	total: number;
	take: number;
	skip: number;
};
