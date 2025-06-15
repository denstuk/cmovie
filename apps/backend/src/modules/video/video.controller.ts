import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";
import { VideoService } from "./video.service";
import { AuthGuard } from "../auth/auth.guard";
import { VideoSearchDto } from "./dtos/video-search.dto";
import { PaginatedDto } from "../common/paginated.dto";
import { VideoDto } from "./dtos/video.dto";
import { EmptyResponseDto } from "../common/responses.dto";
import { VideoCommentCreateDto } from "./dtos/video-comment-create.dto";
import { CurrentUser } from "../auth/user.decorator";
import { UserEntity } from "../../entities/user.entity";
import { VideoCommentEntity } from "../../entities/video-comment.entity";
import {
	VideoSignedUrlDto,
} from "./dtos/video-signed-url.dto";

@Controller("videos")
export class VideoController {
	constructor(private readonly videoService: VideoService) {}

	@UseGuards(AuthGuard)
	@Get()
	async search(
		@Query() query: VideoSearchDto,
	): Promise<PaginatedDto<VideoDto>> {
		return this.videoService.search(query);
	}

	@UseGuards(AuthGuard)
	@Get(":id")
	async getById(@Param("id") id: string): Promise<VideoDto> {
		return this.videoService.getById(id);
	}

	@UseGuards(AuthGuard)
	@Post(":id/signed-url")
	async generateSignedUrl(
		@CurrentUser() user: UserEntity,
		@Req() request: Request,
		@Param("id") videoId: string,
	): Promise<VideoSignedUrlDto> {
		const country = request.headers["cloudfront-viewer-country"] as string;
		const userId = user.id;

		return this.videoService.getSignedUrl({
			country,
			videoId,
			userId,
		});
	}

	@UseGuards(AuthGuard)
	@Get(":id/comments")
	async getComments(
		@Param("id") id: string,
	): Promise<PaginatedDto<VideoCommentEntity>> {
		return this.videoService.getComments(id);
	}

	@UseGuards(AuthGuard)
	@Post(":id/comments")
	async createComment(
		@CurrentUser() user: UserEntity,
		@Param("id") id: string,
		@Body() body: VideoCommentCreateDto,
	): Promise<EmptyResponseDto> {
		await this.videoService.createComment({
			...body,
			videoId: id,
			user,
		});
		return {};
	}
}
