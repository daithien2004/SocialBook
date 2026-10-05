import { Dispatcher } from '@/application/common/dispatcher';
import { GetModerationStatsQuery } from '@/application/posts/queries/get-moderation-stats/get-moderation-stats.query';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { CreatePostDto } from '@/presentation/posts/dto/create-post.dto';
import { PaginationUserDto } from '@/presentation/posts/dto/pagination.dto';
import { UpdatePostDto } from '@/presentation/posts/dto/update-post.dto';

import { Public } from '@/common/decorators/custom.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentAbility } from '@/common/decorators/current-ability.decorator';
import type { AppAbility } from '@socialbook/shared';

// Use Cases
import { ApprovePostCommand } from '@/application/posts/commands/approve-post/approve-post.command';
import { CreatePostCommand } from '@/application/posts/commands/create-post/create-post.command';
import { DeletePostCommand } from '@/application/posts/commands/delete-post/delete-post.command';
import { GetFlaggedPostsQuery } from '@/application/posts/queries/get-flagged-posts/get-flagged-posts.query';
import { GetPostQuery } from '@/application/posts/queries/get-post/get-post.query';
import { GetPostsByUserQuery } from '@/application/posts/queries/get-posts-by-user/get-posts-by-user.query';
import { GetPostsQuery } from '@/application/posts/queries/get-posts/get-posts.query';
import { RejectPostCommand } from '@/application/posts/commands/reject-post/reject-post.command';
import { RemovePostImageCommand } from '@/application/posts/commands/remove-post-image/remove-post-image.command';
import { UpdatePostCommand } from '@/application/posts/commands/update-post/update-post.command';
import { PostResponseDto } from '@/presentation/posts/dto/post.response.dto';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export class FlaggedPostsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['newest', 'oldest', 'violations'])
  declare sortBy?: 'newest' | 'oldest' | 'violations';
}

@Controller('posts')
export class PostsController {
  constructor(
    private readonly dispatcher: Dispatcher,

    ) {}

  @Public()
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const limit = Math.min(query.actualLimit || 10, 100);
    const postsQuery = new GetPostsQuery(limit, query.cursor, userId);
    const result = await this.dispatcher.query(postsQuery);
    return {
      message: 'Get posts successfully',
      data: PostResponseDto.fromArray(result.data),
      meta: {
        limit,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    };
  }

  @Public()
  @Get('user')
  async findAllByUser(
    @CurrentUser('id') currentUserId: string,
    @Query() query: PaginationUserDto,
  ) {
    const limit = Math.min(query.actualLimit || 10, 100);
    const postsQuery = new GetPostsByUserQuery(
      query.userId,
      limit,
      query.cursor,
      currentUserId,
    );
    const result = await this.dispatcher.query(postsQuery);
    return {
      message: 'Get posts successfully',
      data: PostResponseDto.fromArray(result.data),
      meta: {
        limit,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    };
  }

  @Public()
  @Get(':id')
  async findOne(
    @Query('userId') userId: string | undefined,
    @Param('id') id: string,
  ) {
    const query = new GetPostQuery(id, userId);
    const data = await this.dispatcher.query(query);
    return {
      message: 'Get post detail successfully',
      data: new PostResponseDto(data),
    };
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePostDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    files?: Express.Multer.File[],
  ) {
    const command = new CreatePostCommand(userId, dto.bookId, dto.content, files);
    const { post, moderationMessage } = await this.dispatcher.command(command);

    const responseDto = new PostResponseDto(post);
    return {
      message: moderationMessage ? undefined : 'Đăng bài viết thành công',
      data: responseDto,
      warning: moderationMessage,
    };
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    files?: Express.Multer.File[],
    @CurrentUser('id') userId?: string,
    @CurrentAbility() ability?: AppAbility,
  ) {
    const command = new UpdatePostCommand(
      userId || '',
      id,
      ability!,
      dto.content,
      dto.bookId,
      dto.imageUrls,
    );
    const { post, moderationMessage } = await this.dispatcher.command(command);
    return {
      message: moderationMessage ? undefined : 'Cập nhật bài viết thành công',
      data: new PostResponseDto(post),
      warning: moderationMessage,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    const command = new DeletePostCommand(userId, id, ability, false);
    await this.dispatcher.command(command);
    return {
      message: 'Delete post successfully',
    };
  }

  @Delete(':id/permanent')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async removeHard(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    const command = new DeletePostCommand(userId, id, ability, true);
    await this.dispatcher.command(command);
    return {
      message: 'Permanently deleted post',
    };
  }

  @Delete(':id/images')
  async removeImage(
    @Param('id') id: string,
    @Body('imageUrl') imageUrl: string,
    @CurrentUser('id') userId: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    if (!imageUrl) throw new BadRequestException('imageUrl is required');

    const command = new RemovePostImageCommand(userId, id, ability, imageUrl);
    const data = await this.dispatcher.command(command);
    return {
      message: 'Image removed successfully',
      data,
    };
  }

  // ===== ADMIN ENDPOINTS =====

  @Get('admin/flagged')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getFlaggedPosts(@Query() query: FlaggedPostsQueryDto) {
    const limit = query.actualLimit > 100 ? 100 : query.actualLimit;
    const flaggedQuery = new GetFlaggedPostsQuery(
      query.actualPage,
      limit,
      query.reason,
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
      query.sortBy,
    );
    const result = await this.dispatcher.query(flaggedQuery);
    return {
      message: 'Get flagged posts successfully',
      data: PostResponseDto.fromArray(result.data),
      meta: result.meta,
    };
  }

  @Get('admin/moderation/stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getModerationStats() {
    const data = await this.dispatcher.query(new GetModerationStatsQuery());
    return {
      message: 'Get moderation stats successfully',
      data,
    };
  }

  @Patch('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async approvePost(@Param('id') id: string) {
    const command = new ApprovePostCommand(id);
    const result = await this.dispatcher.command(command);
    return {
      message: result.message,
    };
  }

  @Delete('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async rejectPost(@Param('id') id: string) {
    const command = new RejectPostCommand(id, 'Rejected by admin');
    const result = await this.dispatcher.command(command);
    return {
      message: result.message,
    };
  }

  @Post('admin/bulk-approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async bulkApprovePosts(@Body('postIds') postIds: string[]) {
    if (!postIds || !Array.isArray(postIds))
      throw new BadRequestException('postIds array is required');

    const results = await Promise.allSettled(
      postIds.map((id) =>
        this.dispatcher.command(new ApprovePostCommand(id)),
      ),
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    return {
      message: `Approved ${successCount}/${postIds.length} posts`,
    };
  }

  @Post('admin/bulk-reject')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async bulkRejectPosts(@Body('postIds') postIds: string[]) {
    if (!postIds || !Array.isArray(postIds))
      throw new BadRequestException('postIds array is required');

    const results = await Promise.allSettled(
      postIds.map((id) =>
        this.dispatcher.command(
          new RejectPostCommand(id, 'Rejected by admin'),
        ),
      ),
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    return {
      message: `Rejected ${successCount}/${postIds.length} posts`,
    };
  }
}
