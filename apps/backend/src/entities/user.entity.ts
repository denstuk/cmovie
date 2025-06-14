import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryColumn,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

@Entity("t_user")
export class UserEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column("text", { unique: true })
	username: string;
}
