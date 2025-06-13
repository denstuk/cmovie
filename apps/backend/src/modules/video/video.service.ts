import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { VideoEntity } from "../../entities/video.entity";
import { Paginated } from "../../common/types";
import { Repository } from "typeorm";
import { UserEntity } from "../../entities/user.entity";
import { VideoCommentCreateDto } from "./dtos/video-comment-create.dto";
import { VideoCommentEntity } from "../../entities/video-comment.entity";

type SearchParams = {
  searchTerm?: string;
  take?: number;
  skip?: number;
};

type VideoCommentCreateParams = VideoCommentCreateDto & {
  user: UserEntity;
};


@Injectable()
export class VideoService {
  constructor(
    @Inject('VIDEO_REPOSITORY')
    private videoRepository: Repository<VideoEntity>,
    @Inject('VIDEO_COMMENT_REPOSITORY')
    private videoCommentRepository: Repository<VideoCommentEntity>,
  ) {}

  async search({ searchTerm, take, skip }: SearchParams): Promise<Paginated<VideoEntity>> {
    const queryBuilder = this.videoRepository.createQueryBuilder('video');

    if (searchTerm) {
      queryBuilder.where('video.title ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
        .orWhere('video.description ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
        .orWhere('video.tags ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` });
    }

    const [items, total] = await queryBuilder
      .take(take || 10)
      .skip(skip || 0)
      .getManyAndCount();

    return {
      items,
      total,
      take: take || 10,
      skip: skip || 0,
    };
  }

  async update(videoId: string, videoData: Partial<VideoEntity>): Promise<VideoEntity> {
    const video = await this.videoRepository.findOneBy({ id: videoId });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return this.videoRepository.save({
      ...video,
      ...videoData
    });
  }

  async getComments(videoId: string): Promise<Paginated<VideoCommentEntity>> {
    const queryBuilder = this.videoCommentRepository.createQueryBuilder('comment')
      .where('comment.videoId = :videoId', { videoId });

    const [items, total] = await queryBuilder
      .take(10)
      .skip(0)
      .getManyAndCount();

    return {
      items,
      total,
      take: 10,
      skip: 0,
    };
  }

  async createComment(params: VideoCommentCreateParams): Promise<void> {
    const { comment, videoId, user } = params;

    const video = await this.videoRepository.findOneBy({ id: videoId });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const newComment = this.videoCommentRepository.create({
      videoId,
      comment,
      userId: user.id,
    });

    await this.videoCommentRepository.save(newComment);
  }
}
