import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { VideoEntity } from "./video.entity";
import { UserEntity } from "./user.entity";

@Entity("t_video_comment")
export class VideoCommentEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column("text", { name: "video_id" })
	videoId: string;

	@Column("text", { name: "user_id" })
	userId: string;

	@Column("text")
	comment: string;

	@CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
	createdAt: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
	updatedAt: Date;

	@ManyToOne(() => VideoEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "video_id" })
	video: VideoEntity;

	@ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "user_id" })
	user: UserEntity;
}
