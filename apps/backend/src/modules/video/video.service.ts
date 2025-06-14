import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { VideoEntity } from "../../entities/video.entity";
import { Paginated } from "../../common/types";
import { Repository } from "typeorm";
import { UserEntity } from "../../entities/user.entity";
import { VideoCommentCreateDto } from "./dtos/video-comment-create.dto";
import { VideoCommentEntity } from "../../entities/video-comment.entity";
import { VIDEO_COMMENT_REPO, VIDEO_REPO } from "../../database/database.repos";
import { VideoSignedUrlDto } from "./dtos/video-signed-url.dto";
import { COUNTRY_CODES, DEFAULT_VIEW_SIGNED_URL_EXPIRATION } from "../../common/constants";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { ConfigService } from "@nestjs/config";

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
	url: string;
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
	) {}

	async search({
		searchTerm,
		take,
		skip,
	}: SearchParams): Promise<Paginated<VideoEntity>> {
		const queryBuilder = this.videoRepository.createQueryBuilder("video");

		if (searchTerm) {
			queryBuilder
				.where("video.title ILIKE :searchTerm", {
					searchTerm: `%${searchTerm}%`,
				})
				.orWhere("video.description ILIKE :searchTerm", {
					searchTerm: `%${searchTerm}%`,
				})
				.orWhere("video.tags ILIKE :searchTerm", {
					searchTerm: `%${searchTerm}%`,
				});
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

	async getById(id: string): Promise<VideoEntity> {
		const video = await this.videoRepository.findOne({
			where: { id },
		});

		if (!video) {
			throw new NotFoundException("Video not found");
		}

		return video;
	}

	async update(
		videoId: string,
		videoData: Partial<VideoEntity>,
	): Promise<VideoEntity> {
		const video = await this.videoRepository.findOneBy({ id: videoId });
		if (!video) {
			throw new NotFoundException("Video not found");
		}

		return this.videoRepository.save({
			...video,
			...videoData,
		});
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
    url,
	}: GetSignedUrlParams): Promise<VideoSignedUrlDto> {
    const video = await this.videoRepository.findOneBy({ id: videoId });
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    const blockedCountryCodes = new Set((video.regionsBlocked || []).map((country: string) => COUNTRY_CODES[country]));
    console.log(blockedCountryCodes);
    console.log(`Country code: ${country}`);

    if (country && blockedCountryCodes.has(country)) {
      throw new ForbiddenException('Access denied from your region');
    }

    const signedUrl = getSignedUrl({
      url,
      keyPairId: this.configService.getOrThrow<string>('CLOUDFRONT_KEY_PAIR_ID'),
      privateKey: this.configService.getOrThrow<string>('CLOUDFRONT_PRIVATE_KEY'),
      dateLessThan: new Date(Date.now() + DEFAULT_VIEW_SIGNED_URL_EXPIRATION),
    });

    return { signedUrl };
  }
}
