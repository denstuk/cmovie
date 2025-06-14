import { useState } from "react";
import type { FC } from "react";
import { getVideos } from "../../api/api";
import { PageLoader } from "../../components/page-loader";
import { VideoCard } from "../../components/video-card";
import { Page } from "../../components/page/page";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "../../auth/auth.context";
import { useDebounce } from "../../hooks/useDebounce";

export const HomePage: FC = () => {
	const { user } = useAuthContext();
	const [inputValue, setInputValue] = useState<string>("");
	const searchBy = useDebounce<string>(inputValue, 500);

	const {
		data: videos = [],
		isLoading,
		error
	} = useQuery({
		queryKey: ["videos", user?.userId, searchBy],
		queryFn: async () => {
			const { items } = await getVideos({
				userId: user?.userId as string,
				searchTerm: searchBy,
				take: 20,
				skip: 0,
			});
			return items || [];
		},
	});

	if (error && videos.length === 0) {
		return (
			<Page>
				<div className="text-center py-12">
					<h2 className="text-xl font-semibold text-red-600">
						{error?.message}
					</h2>
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
						onChange={(e) => setInputValue(e.target.value.trim())}
						value={inputValue}
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

			{isLoading ? (
        <PageLoader />
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
					<h2 className="text-xl font-semibold">No videos found</h2>
				</div>
      ) : (
				<>
					<div className="container mx-auto px-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
							{videos.map((video) => (
								<div key={video.id} className="flex justify-center">
									<VideoCard key={video.id} video={video} />
								</div>
							))}
						</div>
					</div>
				</>
			)}
		</Page>
	);
};
