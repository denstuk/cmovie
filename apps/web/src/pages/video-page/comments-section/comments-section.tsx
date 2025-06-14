import { useCallback, useState, type FC } from "react";
import { useAuthContext } from "../../../auth/auth.context";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { VideoCommentDto } from "../../../api/types";
import { createVideoComment, getVideoComments } from "../../../api/api";
import { toast } from "sonner";

type CommentsSectionProps = {
	videoId: string;
};

export const CommentsSection: FC<CommentsSectionProps> = ({
	videoId,
}: CommentsSectionProps) => {
	const { user } = useAuthContext();

	const [comments, setComments] = useState<VideoCommentDto[]>();
	const [comment, setComment] = useState<string>("");

	const { mutate: createComment } = useMutation({
		mutationKey: ["createVideoComment", videoId, user],
		mutationFn: async (commentText: string) => {
			if (!user || !videoId || !commentText.trim()) return;
			await createVideoComment({
				user,
				videoId,
				comment: commentText,
			});
		},
		onError: (error) => {
			toast.error(`Failed to create comment: ${error}`);
		},
	});

	useQuery({
		queryKey: ["videoComments", videoId, user],
		queryFn: async () => {
			if (!user || !videoId) return [];
			const paginated = await getVideoComments(user, videoId);
			setComments(paginated.items || []);
		},
		retry: 2,
	});

	const onCreateComment = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		if (!comment.trim()) return;

		// Optimistically update the comments state
		setComments((prev) => [
			{
				id: Date.now().toString(),
				videoId: videoId as string,
				userId: user?.userId as string,
				user: {
					username: user?.username || "Anonymous",
					id: user?.userId || "unknown",
				},
				comment,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			...(prev || []),
		]);

		await createComment(comment.trim());
		setComment("");
	}, []);

	return (
		<div className="mt-8">
			<h2 className="text-2xl font-bold text-gray-100 mb-4">Comments</h2>

			{/* Add comment form */}
			<form onSubmit={onCreateComment} className="mb-6">
				<div className="flex">
					<input
						type="text"
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						placeholder="Add a comment..."
						className="flex-grow p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-white"
					/>
					<button
						type="submit"
						className="bg-white text-black px-4 py-2 rounded-r-md hover:bg-gray-300 transition-all duration-200 cursor-pointer"
					>
						Comment
					</button>
				</div>
			</form>

			{/* Comments list */}
			<div className="space-y-4 mb-10">
				{(comments ?? []).map((comment) => (
					<div key={comment.id} className="p-4 bg-gray-50 rounded-md">
						<div className="flex items-center mb-2">
							<div className="h-8 w-8 bg-gray-300 rounded-full"></div>
							<div className="ml-2">
								<p className="font-medium text-gray-800">
									{comment.user.username}
								</p>
								<p className="text-xs text-gray-500">{comment.createdAt}</p>
							</div>
						</div>
						<p className="text-gray-700">{comment.comment}</p>
					</div>
				))}
			</div>
		</div>
	);
};
