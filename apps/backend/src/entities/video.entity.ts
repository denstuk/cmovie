import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('t_video')
export class VideoEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { name: 'file_key' })
  fileKey: string;

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column('text', { array: true, name: 'regions_blocked', default: [] })
  regionsBlocked: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}