import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { videoGeneratePresignedUrl } from "../../api/api";
import { PageLoader } from "../../components/page-loader";
import { config } from "../../config";
import type { Video } from "../../models/video";
import { Page } from "../../components/page/page";
import { CommentsSection } from "./comments-section/comments-section";

export const VideoPage: FC = () => {
	const { videoId } = useParams<{ videoId: string }>();
	const videoRef = useRef<HTMLVideoElement>(null);
	const VIDEO_PROGRESS_KEY = `video-progress-${videoId}`;

	const [videoData, setVideoData] = useState<Video | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);

	useEffect(() => {
		const fetchVideoData = async () => {
			if (!videoId) return;

			try {
				setIsLoading(true);
				const response = await fetch(`${config.apiUrl}/videos/${videoId}`);

				if (!response.ok) {
					if (response.status === 404) {
						throw new Error("Video not found");
					}
					throw new Error("Failed to fetch video data");
				}

				const data = await response.json();
				setVideoData(data.video);

				const videoUrl = getVideoUrl(data.video.file_key);
				const signedUrl = await videoGeneratePresignedUrl(
					data.video.video_id,
					videoUrl,
				);
				console.log(`Signed URL: ${signedUrl}`);
				setSignedVideoUrl(signedUrl);
			} catch (err) {
				console.error("Error fetching video data:", err);
				setError(
					err instanceof Error ? err.message : "An unknown error occurred",
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchVideoData();
	}, [videoId]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		// Load saved progress
		const savedTime = localStorage.getItem(VIDEO_PROGRESS_KEY);
		if (savedTime) {
			video.currentTime = Number.parseFloat(savedTime);
		}

		// Save progress periodically
		const handleTimeUpdate = () => {
			localStorage.setItem(VIDEO_PROGRESS_KEY, video.currentTime.toString());
		};

		video.addEventListener("timeupdate", handleTimeUpdate);

		return () => {
			video.removeEventListener("timeupdate", handleTimeUpdate);
		};
	}, [VIDEO_PROGRESS_KEY, videoData]);

	const handleShare = () => {
		navigator.clipboard
			.writeText(window.location.href)
			.then(() => toast.info("URL copied to clipboard!"));
	};

	// Get the video URL from the file_key
	const getVideoUrl = (fileKey: string) => {
		// For testing fallback
		if (fileKey.startsWith("sample/")) {
			return "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
		}
		console.log(`https://${config.cloudfrontDomain}/${fileKey}`);

		// Real CloudFront URL
		return `https://${config.cloudfrontDomain}/${fileKey}`;
	};

	if (isLoading) {
		return (
			<Page>
				<PageLoader />
			</Page>
		);
	}

	if (error || !videoData || !signedVideoUrl) {
		return (
			<Page>
				<div className="text-center py-12">
					<h2 className="text-xl font-semibold text-red-600">
						{error || "Video not found"}
					</h2>
					<button
						onClick={() => (window.location.href = "/")}
						className="mt-4 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-400 cursor-pointer"
					>
						Back to Home
					</button>
				</div>
			</Page>
		);
	}

	return (
		<Page>
			<div className="max-w-full">
				<div className="flex justify-between items-center">
					<h1 className="text-4xl font-bold text-white">{videoData.title}</h1>
					<button
						onClick={handleShare}
						className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-all cursor-pointer"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5 mr-2"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
						</svg>
						Share
					</button>
				</div>
				<p className="mt-4 text-lg text-gray-100">
					{videoData.tags.join(", ")}
				</p>

				{/* Video container with responsive width */}
				<div className="w-full mt-4">
					<video className="w-full h-auto" controls ref={videoRef}>
						<source src={signedVideoUrl} type="video/mp4" />
						Your browser does not support the video tag.
					</video>
				</div>

				{/* Description */}
				<div className="mt-6">
					<h2 className="text-2xl font-bold text-white mb-2">Description</h2>
					<p className="text-gray-100">
						{videoData.description || "No description provided."}
					</p>
				</div>

				{/* Comments section */}
				<CommentsSection videoId={videoId as string} />
			</div>
		</Page>
	);
};
