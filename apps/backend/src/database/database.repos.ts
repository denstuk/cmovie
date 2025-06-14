import { DataSource } from "typeorm";
import { VideoEntity } from "../entities/video.entity";
import { UserEntity } from "../entities/user.entity";
import { VideoCommentEntity } from "../entities/video-comment.entity";

export const DATA_SOURCE = "DATA_SOURCE";
export const VIDEO_REPO = "VIDEO_REPO";
export const VIDEO_COMMENT_REPO = "VIDEO_COMMENT_REPO";
export const USER_REPO = "USER_REPO";

export const VIDEO_REPO_PROVIDER = {
	provide: VIDEO_REPO,
	useFactory: (dataSource: DataSource) => dataSource.getRepository(VideoEntity),
	inject: [DATA_SOURCE],
};

export const VIDEO_COMMENT_REPO_PROVIDER = {
	provide: VIDEO_COMMENT_REPO,
	useFactory: (dataSource: DataSource) =>
		dataSource.getRepository(VideoCommentEntity),
	inject: [DATA_SOURCE],
};

export const USER_REPO_PROVIDER = {
	provide: USER_REPO,
	useFactory: (dataSource: DataSource) => dataSource.getRepository(UserEntity),
	inject: [DATA_SOURCE],
};
