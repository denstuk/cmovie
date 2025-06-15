import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { VideoEntity } from "../../entities/video.entity";
import { Paginated } from "../../common/types";
import { Repository } from "typeorm";
import { UserEntity } from "../../entities/user.entity";
import { VideoCommentCreateDto } from "./dtos/video-comment-create.dto";
import { VideoCommentEntity } from "../../entities/video-comment.entity";
import { VIDEO_COMMENT_REPO, VIDEO_REPO } from "../../database/database.repos";
import { VideoSignedUrlDto } from "./dtos/video-signed-url.dto";
import { COUNTRY_CODES } from "../../common/constants";
import { ConfigService } from "@nestjs/config";
import { VideoDto } from "./dtos/video.dto";
import { AwsService } from "../aws/aws.service";

type SearchParams = {
	searchTerm?: string;
	take?: number;
	skip?: number;
};

type VideoCommentCreateParams = VideoCommentCreateDto & {
	user: UserEntity;
};

type GetSignedUrlParams = {
	country: string;
	videoId: string;
	userId: string;
};

@Injectable()
export class VideoService {
	constructor(
		@Inject(VIDEO_REPO)
		private videoRepository: Repository<VideoEntity>,
		@Inject(VIDEO_COMMENT_REPO)
		private videoCommentRepository: Repository<VideoCommentEntity>,
    private readonly configService: ConfigService,
    private readonly awsService: AwsService,
	) {}

	async search({
		searchTerm,
		take,
		skip,
	}: SearchParams): Promise<Paginated<VideoDto>> {
		const queryBuilder = this.videoRepository.createQueryBuilder("video");

		if (searchTerm) {
			queryBuilder
        .where("search_vector @@ plainto_tsquery('english', :searchTerm)", {
          searchTerm
        })
        .orWhere("similarity(search_combined, :searchTerm) > 0.05", {
          searchTerm,
        });
		}

		const [items, total] = await queryBuilder
			.take(take || 10)
			.skip(skip || 0)
			.getManyAndCount();

		return {
			items: items.map(this.asVideoDto),
			total,
			take: take || 10,
			skip: skip || 0,
		};
	}

	async getById(id: string): Promise<VideoDto> {
		const video = await this.videoRepository.findOne({
			where: { id },
		});

		if (!video) {
			throw new NotFoundException("Video not found");
		}

		return this.asVideoDto(video);
	}

	async getComments(videoId: string): Promise<Paginated<VideoCommentEntity>> {
		const queryBuilder = this.videoCommentRepository
			.createQueryBuilder("comment")
			.where("comment.videoId = :videoId", { videoId })
			.leftJoinAndSelect("comment.user", "user")
			.orderBy("comment.createdAt", "DESC");

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
			throw new NotFoundException("Video not found");
		}

		const newComment = this.videoCommentRepository.create({
			videoId,
			comment,
			userId: user.id,
		});

		await this.videoCommentRepository.save(newComment);
	}

	async getSignedUrl({
    country,
		videoId,
	}: GetSignedUrlParams): Promise<VideoSignedUrlDto> {
    const video = await this.videoRepository.findOneBy({ id: videoId });
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    const blockedCountryCodes = new Set((video.regionsBlocked || []).map((country: string) => COUNTRY_CODES[country]));
    if (country && blockedCountryCodes.has(country)) {
      throw new ForbiddenException('Access denied from your region');
    }

    const domain = this.configService.getOrThrow<string>('CLOUDFRONT_DOMAIN');
    const signedUrl = await this.awsService.generateSignedUrl(`https://${domain}/${video.fileKey}`);

    return { signedUrl };
  }

  private asVideoDto(video: VideoEntity): VideoDto {
    return {
      id: video.id,
      title: video.title,
      description: video.description,
      fileKey: video.fileKey,
      updatedAt: video.updatedAt,
      createdAt: video.createdAt,
      tags: video.tags,
    }
  }
}
