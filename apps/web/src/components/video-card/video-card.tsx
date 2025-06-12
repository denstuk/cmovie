import type { FC } from "react";
import { Link } from "react-router";
import type { Video } from "../../models/video";

// TODO: For now, we'll use placeholder images
const getThumbnailUrl = (fileKey: string) => {
	const id =
		(Number.parseInt(fileKey.split("/").pop()?.split(".")[0] || "0", 10) % 20) +
		100;
	return `https://picsum.photos/id/${id}/400/250`;
};

type VideoCardProps = {
	video: Video;
};

export const VideoCard: FC<VideoCardProps> = ({ video }) => {
	return (
		<Link
			key={video.video_id}
			to={`/video/${video.video_id}`}
			className="video-card transition-all duration-300 hover:scale-105 group w-[280px]"
		>
			<div className="relative w-full rounded-lg overflow-hidden">
				<div className="aspect-video">
					<img
						src={getThumbnailUrl(video.file_key)}
						alt={`${video.title} thumbnail`}
						className="w-full h-full object-cover rounded-lg shadow-md"
					/>
				</div>
				<div className="absolute bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent w-full">
					<h3 className="text-white font-semibold text-lg">{video.title}</h3>
					<p className="text-gray-200 text-sm line-clamp-2">
						{video.description}
					</p>
					<div className="overflow-hidden max-h-0 group-hover:max-h-[50px] transition-all duration-300">
						<p className="text-sm text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
							{video.tags.join(", ")}
						</p>
					</div>
				</div>
			</div>
		</Link>
	);
};
