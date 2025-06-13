// Fallback sample videos when API is not available
// TODO: Delete after testing
export const getSampleVideos = () => [
	{
		video_id: "1",
		title: "Big Buck Bunny",
		description: "A short animated film featuring a giant rabbit",
		file_key: "sample/bunny.mp4",
		upload_date: "2023-01-01T00:00:00.000Z",
		tags: ["animation", "comedy"],
		regions_blacklist: [],
	},
	{
		video_id: "2",
		title: "Ocean Documentary",
		description:
			"Explore the depths of our oceans in this stunning documentary",
		file_key: "sample/ocean.mp4",
		upload_date: "2023-01-02T00:00:00.000Z",
		tags: ["documentary", "nature"],
		regions_blacklist: [],
	},
	{
		video_id: "3",
		title: "Mountain Adventure",
		description: "Follow climbers as they ascend the world's tallest peaks",
		file_key: "sample/mountain.mp4",
		upload_date: "2023-01-03T00:00:00.000Z",
		tags: ["adventure", "sports"],
		regions_blacklist: [],
	},
];
