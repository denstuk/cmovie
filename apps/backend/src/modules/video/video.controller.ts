import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { VideoService } from "./video.service";
import { AuthGuard } from "../auth/auth.guard";
import { VideoSearchDto } from "./dtos/video-search.dto";
import { PaginatedDto } from "../common/paginated.dto";
import { VideoDto } from "./dtos/video.dto";
import { EmptyResponseDto } from "../common/responses.dto";
import { VideoUpdateDto } from "./dtos/video-update.dto";
import { VideoCommentCreateDto } from "./dtos/video-comment-create.dto";
import { CurrentUser } from "../auth/user.decorator";
import { UserEntity } from "../../entities/user.entity";
import { VideoCommentEntity } from "../../entities/video-comment.entity";

@Controller('videos')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('search')
  async search(@Body() body: VideoSearchDto): Promise<PaginatedDto<VideoDto>> {
    return this.videoService.search(body);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: VideoUpdateDto): Promise<EmptyResponseDto> {
    return this.videoService.update(id, body);
  }

  @UseGuards(AuthGuard)
  @Get(':id/comments')
  async getComments(@Param('id') id: string): Promise<PaginatedDto<VideoCommentEntity>> {
    return this.videoService.getComments(id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/comments')
  async createComment(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() body: VideoCommentCreateDto): Promise<EmptyResponseDto> {
    await this.videoService.createComment({
      ...body,
      videoId: id,
      user,
    });
    return {};
  }
}
