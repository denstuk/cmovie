import { useEffect, useState } from "react";
import type { FC } from "react";
import { searchVideos } from "../../api/api";
import { PageLoader } from "../../components/page-loader";
import { VideoCard } from "../../components/video-card";
import { config } from "../../config";
import { getSampleVideos } from "../../mocks/videos";
import type { Video } from "../../models/video";
import { Page } from "../page";

export const HomePage: FC = () => {
	const [videos, setVideos] = useState<Video[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [nextToken, setNextToken] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(true);

	const [searchBy, setSearchBy] = useState<string>("");

	useEffect(() => {
		const debounceTimeout = setTimeout(() => {
			searchVideos(searchBy)
				.then(({ videos, nextToken }) => {
					console.log("Videos fetched:", videos);
					setVideos(videos || []);
					setNextToken(nextToken || null);
					setHasMore(Boolean(nextToken));
					setIsLoading(false);
				})
				.catch((error) => {
					console.error("Error fetching videos:", error);
					setError("Failed to load videos. Please try again later.");
					setIsLoading(false);
				});
		}, 200);

		return () => clearTimeout(debounceTimeout);
	}, [searchBy]);

	useEffect(() => {
		const fetchVideos = async () => {
			try {
				const response = await fetch(`${config.apiUrl}/videos/search`);

				if (!response.ok) {
					throw new Error("Failed to fetch videos");
				}

				const data = await response.json();
				setVideos(data.videos || []);
				setNextToken(data.nextToken || null);
				setHasMore(!!data.nextToken);
			} catch (err) {
				console.error("Error fetching videos:", err);
				setError("Failed to load videos. Please try again later.");
				// Use sample data as fallback when API fails
				setVideos(getSampleVideos());
			} finally {
				setIsLoading(false);
			}
		};

		fetchVideos();
	}, []);

	const loadMoreVideos = async () => {
		if (!nextToken || !hasMore) return;

		try {
			setIsLoading(true);
			const response = await fetch(
				`${config.apiUrl}/videos/search?lastKey=${nextToken}`,
			);

			if (!response.ok) {
				throw new Error("Failed to fetch more videos");
			}

			const data = await response.json();
			setVideos((prevVideos) => [...prevVideos, ...(data.videos || [])]);
			setNextToken(data.nextToken || null);
			setHasMore(!!data.nextToken);
		} catch (err) {
			console.error("Error fetching more videos:", err);
			setError("Failed to load more videos. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading && videos.length === 0) {
		return (
			<Page>
				<PageLoader />
			</Page>
		);
	}

	if (error && videos.length === 0) {
		return (
			<Page>
				<div className="text-center py-12">
					<h2 className="text-xl font-semibold text-red-600">{error}</h2>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="mt-4 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-400"
					>
						Retry
					</button>
				</div>
			</Page>
		);
	}

	return (
		<Page>
			<h1 className="text-3xl font-bold mb-4 text-center mt-8">
				What would you like to watch today?
			</h1>

			<div className="mb-16 max-w-[600px] mx-auto">
				<div className="relative">
					<input
						type="text"
						placeholder="Search videos..."
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-white"
						onChange={(e) => setSearchBy(e.target.value.trim())}
					/>
					<div className="absolute inset-y-0 right-0 flex items-center pr-3">
						<svg
							className="h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</div>
				</div>
			</div>

			{videos.length === 0 ? (
				<div className="text-center py-12">
					<h2 className="text-xl font-semibold">No videos found</h2>
				</div>
			) : (
				<>
					<div className="container mx-auto px-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
							{videos.map((video) => (
								<div className="flex justify-center">
									<VideoCard key={video.video_id} video={video} />
								</div>
							))}
						</div>
					</div>

					{hasMore && (
						<div className="flex justify-center mt-8 mb-4">
							<button
								type="button"
								onClick={loadMoreVideos}
								disabled={isLoading}
								className="px-6 py-2 bg-white-600 text-black rounded-md hover:bg-white disabled:opacity-50"
							>
								{isLoading ? "Loading..." : "Load More Videos"}
							</button>
						</div>
					)}
				</>
			)}
		</Page>
	);
};
