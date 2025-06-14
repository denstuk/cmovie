import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchVideos, updateVideoMetadata } from "../../api/api";
import { PageLoader } from "../../components/page-loader";
import { Page } from "../page";
import { EditModal } from "./edit-modal";
import type { VideoDto } from "../../api/types";

export const HomePage = () => {
  const queryClient = useQueryClient();
	const [selectedVideo, setSelectedVideo] = useState<VideoDto | null>(null);

	const {
		data,
		isLoading,
		error,
		refetch
	} = useQuery({
		queryKey: ['videos'],
		queryFn: async () => {
			try {
				const response = await searchVideos("");
				return {
					videos: response.videos,
				};
			} catch (err) {
				console.error("Error fetching videos:", err);
        toast.error("Failed to fetch videos");
			}
		},
	});

	const videos = data?.videos || [];

	// Update video mutation
	const updateMutation = useMutation({
		mutationFn: async (updatedVideo: VideoDto) => {
			return await updateVideoMetadata(
				updatedVideo.id,
				{
					title: updatedVideo.title,
					description: updatedVideo.description,
					tags: updatedVideo.tags,
					regionsBlocked: updatedVideo.regionsBlocked,
				}
			);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['videos'] });
			toast.success("Video metadata updated successfully");
		},
		onError: (error) => {
			console.error("Error updating video metadata:", error);
			toast.error("Failed to update video metadata");
		}
	});

	// Handler for saving video updates
	const handleSaveVideo = async (updatedVideo: VideoDto) => {
		try {
			await updateMutation.mutateAsync(updatedVideo);
			return Promise.resolve();
		} catch (error) {
			return Promise.reject(error);
		}
	};

	return (
		<Page>
			<div className="container mx-auto px-4 py-16 lg:px-8">
				<div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Content Management</h1>
				</div>

				{/* Videos List */}
				<div className="bg-gray-800 rounded-lg">
					<div className="p-6">
						{isLoading ? (
							<div className="py-8 flex justify-center">
								<PageLoader />
							</div>
						) : error ? (
							<div className="py-4 text-center">
								<p className="text-red-500 mb-2">{error instanceof Error ? error.message : "An error occurred"}</p>
								<button
									type="button"
									onClick={() => refetch()}
									className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
								>
									Reload
								</button>
							</div>
						) : videos.length === 0 ? (
							<div className="py-8 text-center">
								<p className="text-white text-lg">No videos found</p>
							</div>
						) : (
							<>
								<div className="space-y-4">
									{videos.map((video) => (
										<div
											key={video.id}
											className="border border-gray-700 p-4 rounded-lg flex justify-between items-center"
										>
											<div>
												<h3 className="font-semibold text-white">
													{video.title}
												</h3>
												<p className="text-sm text-gray-400">
													Uploaded on{" "}
													{video.updatedAt
														? new Date(video.updatedAt).toLocaleDateString()
														: "Unknown date"}
												</p>
												<p className="text-xs text-gray-500 mt-1">
													Tags:{" "}
													{video.tags && video.tags.length > 0
														? video.tags.join(", ")
														: "None"}
												</p>
												<p className="text-xs text-gray-500">
													Restricted in:{" "}
													{video.regionsBlocked &&
													video.regionsBlocked.length > 0
														? video.regionsBlocked.join(", ")
														: "No restrictions"}
												</p>
											</div>
											<button
												type="button"
												onClick={() => setSelectedVideo(video)}
												className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
											>
												Edit
											</button>
										</div>
									))}
								</div>
							</>
						)}
					</div>
				</div>

				{selectedVideo && (
					<EditModal
						video={selectedVideo}
						isOpen={!!selectedVideo}
						onClose={() => setSelectedVideo(null)}
						onSave={handleSaveVideo}
					/>
				)}

				{/* Loading overlay for the entire page when updating */}
				{updateMutation.isPending && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4" />
							<p>Updating video metadata...</p>
						</div>
					</div>
				)}
			</div>
		</Page>
	);
};
