import { paginated } from '@/shared/platform/dto/paginated.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetModerationStatsQuery } from '@/modules/posts/application/posts/queries/get-moderation-stats/get-moderation-stats.query';

import {
  HttpCode,
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
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

import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { CreatePostDto } from '@/modules/posts/presentation/posts/dto/create-post.dto';
import { PaginationUserDto } from '@/modules/posts/presentation/posts/dto/pagination.dto';
import { UpdatePostDto } from '@/modules/posts/presentation/posts/dto/update-post.dto';

import { Public } from '@/shared/platform/decorators/custom.decorator';
import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { CurrentAbility } from '@/shared/platform/decorators/current-ability.decorator';
import type { AppAbility } from '@socialbook/shared';

// Use Cases
import { ApprovePostCommand } from '@/modules/posts/application/posts/commands/approve-post/approve-post.command';
import { CreatePostCommand } from '@/modules/posts/application/posts/commands/create-post/create-post.command';
import { DeletePostCommand } from '@/modules/posts/application/posts/commands/delete-post/delete-post.command';
import { GetFlaggedPostsQuery } from '@/modules/posts/application/posts/queries/get-flagged-posts/get-flagged-posts.query';
import { GetPostQuery } from '@/modules/posts/application/posts/queries/get-post/get-post.query';
import { GetPostsByUserQuery } from '@/modules/posts/application/posts/queries/get-posts-by-user/get-posts-by-user.query';
import { GetPostsQuery } from '@/modules/posts/application/posts/queries/get-posts/get-posts.query';
import { RejectPostCommand } from '@/modules/posts/application/posts/commands/reject-post/reject-post.command';
import { RemovePostImageCommand } from '@/modules/posts/application/posts/commands/remove-post-image/remove-post-image.command';
import { UpdatePostCommand } from '@/modules/posts/application/posts/commands/update-post/update-post.command';
import { PostResponseDto } from '@/modules/posts/presentation/posts/dto/post.response.dto';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

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

@ApiProblemResponses()
@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @ApiPaginatedResponse(PostResponseDto, 'cursor')
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const limit = Math.min(query.actualLimit || 10, 100);
    const postsQuery = new GetPostsQuery(limit, query.cursor, userId);
    const result = await this.queryBus.execute(postsQuery);
    return paginated(PostResponseDto.fromArray(result.data), {
      limit,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }

  @Public()
  @ApiPaginatedResponse(PostResponseDto, 'cursor')
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
    const result = await this.queryBus.execute(postsQuery);
    return paginated(PostResponseDto.fromArray(result.data), {
      limit,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }

  @Public()
  @Get(':id')
  @ApiOkResponse({ type: PostResponseDto })
  async findOne(
    @Query('userId') userId: string | undefined,
    @Param('id') id: string,
  ) {
    const query = new GetPostQuery(id, userId);
    const data = await this.queryBus.execute(query);
    return new PostResponseDto(data);
  }

  @Post()
  @ApiCreatedResponse({ type: PostResponseDto })
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePostDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    files?: Express.Multer.File[],
  ) {
    const command = new CreatePostCommand(
      userId,
      dto.bookId,
      dto.content,
      files,
    );
    const { post, moderationMessage } = await this.commandBus.execute(command);

    return new PostResponseDto(
      post,
      moderationMessage ? [moderationMessage] : undefined,
    );
  }

  @Patch(':id')
  @ApiOkResponse({ type: PostResponseDto })
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
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
    const { post, moderationMessage } = await this.commandBus.execute(command);
    return new PostResponseDto(
      post,
      moderationMessage ? [moderationMessage] : undefined,
    );
  }

  @HttpCode(204)
  @Delete(':id')
  @ApiNoContentResponse()
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    const command = new DeletePostCommand(userId, id, ability, false);
    await this.commandBus.execute(command);
    return undefined;
  }

  @HttpCode(204)
  @Delete(':id/permanent')
  @ApiNoContentResponse()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async removeHard(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    const command = new DeletePostCommand(userId, id, ability, true);
    await this.commandBus.execute(command);
    return undefined;
  }

  @HttpCode(204)
  @Delete(':id/images')
  @ApiNoContentResponse()
  async removeImage(
    @Param('id') id: string,
    @Body('imageUrl') imageUrl: string,
    @CurrentUser('id') userId: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    if (!imageUrl) throw new BadRequestException('imageUrl is required');

    const command = new RemovePostImageCommand(userId, id, ability, imageUrl);
    await this.commandBus.execute(command);
  }

  // ===== ADMIN ENDPOINTS =====

  @Get('admin/flagged')
  @ApiPaginatedResponse(PostResponseDto, 'offset')
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
    const result = await this.queryBus.execute(flaggedQuery);
    return paginated(PostResponseDto.fromArray(result.data), result.meta);
  }

  @Get('admin/moderation/stats')
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['total', 'toxic', 'spoiler', 'other'],
      properties: {
        total: { type: 'integer' },
        toxic: { type: 'integer' },
        spoiler: { type: 'integer' },
        other: { type: 'integer' },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getModerationStats() {
    const data = await this.queryBus.execute(new GetModerationStatsQuery());
    return data;
  }

  @Patch('admin/:id/approve')
  @HttpCode(204)
  @ApiNoContentResponse()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async approvePost(@Param('id') id: string) {
    const command = new ApprovePostCommand(id);
    await this.commandBus.execute(command);
    return undefined;
  }

  @HttpCode(204)
  @Delete('admin/:id/reject')
  @ApiNoContentResponse()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async rejectPost(@Param('id') id: string) {
    const command = new RejectPostCommand(id, 'Rejected by admin');
    await this.commandBus.execute(command);
    return undefined;
  }

  @Post('admin/bulk-approve')
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['successCount', 'total'],
      properties: {
        successCount: { type: 'integer' },
        total: { type: 'integer' },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async bulkApprovePosts(@Body('postIds') postIds: string[]) {
    if (!postIds || !Array.isArray(postIds))
      throw new BadRequestException('postIds array is required');

    const results = await Promise.allSettled(
      postIds.map((id) => this.commandBus.execute(new ApprovePostCommand(id))),
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    return { successCount, total: postIds.length };
  }

  @Post('admin/bulk-reject')
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['successCount', 'total'],
      properties: {
        successCount: { type: 'integer' },
        total: { type: 'integer' },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async bulkRejectPosts(@Body('postIds') postIds: string[]) {
    if (!postIds || !Array.isArray(postIds))
      throw new BadRequestException('postIds array is required');

    const results = await Promise.allSettled(
      postIds.map((id) =>
        this.commandBus.execute(new RejectPostCommand(id, 'Rejected by admin')),
      ),
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    return { successCount, total: postIds.length };
  }
}
