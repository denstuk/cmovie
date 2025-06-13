import { Module } from "@nestjs/common";
import { DataSource } from "typeorm";
import { VideoEntity } from "../../entities/video.entity";
import { VideoService } from "./video.service";
import { VideoController } from "./video.controller";
import { DatabaseModule } from "../../database/database.module";
import { UserEntity } from "../../entities/user.entity";
import { VideoCommentEntity } from "../../entities/video-comment.entity";

@Module({
  imports: [DatabaseModule],
  controllers: [VideoController],
  providers: [
    {
      provide: 'VIDEO_REPOSITORY',
      useFactory: (dataSource: DataSource) => dataSource.getRepository(VideoEntity),
      inject: ['DATA_SOURCE'],
    },
    {
      provide: 'VIDEO_COMMENT_REPOSITORY',
      useFactory: (dataSource: DataSource) => dataSource.getRepository(VideoCommentEntity),
      inject: ['DATA_SOURCE'],
    },
    {
      provide: 'USER_REPOSITORY',
      useFactory: (dataSource: DataSource) => dataSource.getRepository(UserEntity),
      inject: ['DATA_SOURCE'],
    },
    VideoService,
  ],
  exports: []
})
export class VideoModule {}
