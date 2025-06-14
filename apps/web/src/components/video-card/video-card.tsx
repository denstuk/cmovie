import type { FC } from "react";
import { Link } from "react-router";
import type { VideoDto } from "../../api/types";

// TODO: For now, we'll use placeholder images
const getThumbnailUrl = (fileKey: string) => {
	const id =
		(Number.parseInt(fileKey.split("/").pop()?.split(".")[0] || "0", 10) % 20) +
		100;
	return `https://picsum.photos/id/${id}/400/250`;
};

type VideoCardProps = {
	video: VideoDto;
};

export const VideoCard: FC<VideoCardProps> = ({ video }) => {
	return (
		<Link
			key={video.id}
			to={`/video/${video.id}`}
			className="video-card transition-all duration-300 hover:scale-105 group w-[320px]"
		>
			<div className="relative w-full rounded-lg overflow-hidden">
				<div className="aspect-video">
					<img
						src={getThumbnailUrl(video.fileKey)}
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
