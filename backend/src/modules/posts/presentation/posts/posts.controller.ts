import { ApiTags } from '@nestjs/swagger';
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
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { CreatePostDto } from '@/modules/posts/presentation/posts/dto/create-post.dto';
import { PaginationUserDto } from '@/modules/posts/presentation/posts/dto/pagination.dto';
import { UpdatePostDto } from '@/modules/posts/presentation/posts/dto/update-post.dto';
import { FlaggedPostsQueryDto } from '@/modules/posts/presentation/posts/dto/flagged-posts.query.dto';
import { BulkPostIdsDto } from '@/modules/posts/presentation/posts/dto/bulk-post-ids.dto';

import { Public } from '@/shared/platform/decorators/custom.decorator';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';

// Use Cases
import { ApprovePostCommand } from '@/modules/posts/application/posts/commands/approve-post/approve-post.command';
import { DeletePostCommand } from '@/modules/posts/application/posts/commands/delete-post/delete-post.command';
import { GetPostQuery } from '@/modules/posts/application/posts/queries/get-post/get-post.query';
import { GetPostsQuery } from '@/modules/posts/application/posts/queries/get-posts/get-posts.query';
import { RejectPostCommand } from '@/modules/posts/application/posts/commands/reject-post/reject-post.command';
import { RemovePostImageCommand } from '@/modules/posts/application/posts/commands/remove-post-image/remove-post-image.command';
import { PostResponseDto } from '@/modules/posts/presentation/posts/dto/post.response.dto';
import { PostModerationStatsResponseDto } from '@/modules/posts/presentation/posts/dto/post-moderation-stats.response.dto';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@ApiProblemResponses()
@ApiTags('Posts')
@UseGuards(PoliciesGuard)
@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'List' })
  @Public()
  @CheckPolicy('read', 'Post')
  @ApiPaginatedResponse(PostResponseDto, 'cursor')
  @Get()
  async findAll(
    @CurrentActor() actor: Actor,
    @Query() query: PaginationQueryDto,
  ) {
    const limit = query.actualLimit;
    const postsQuery = new GetPostsQuery(actor, limit, query.cursor);
    const result = await this.queryBus.execute(postsQuery);
    return { data: PostResponseDto.fromArray(result.data), meta: result.meta };
  }

  @ApiOperation({ summary: 'Find All By User' })
  @Public()
  @CheckPolicy('read', 'Post')
  @ApiPaginatedResponse(PostResponseDto, 'cursor')
  @Get('user')
  async findAllByUser(
    @CurrentActor() actor: Actor,
    @Query() query: PaginationUserDto,
  ) {
    const postsQuery = query.toQuery(actor);
    const result = await this.queryBus.execute(postsQuery);
    return { data: PostResponseDto.fromArray(result.data), meta: result.meta };
  }

  @ApiOperation({ summary: 'Get' })
  @Public()
  @CheckPolicy('read', 'Post')
  @Get(':id')
  @ApiOkResponse({ type: PostResponseDto })
  async findOne(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const query = new GetPostQuery(id, actor);
    const data = await this.queryBus.execute(query);
    return new PostResponseDto(data);
  }

  @ApiOperation({ summary: 'Create' })
  @CheckPolicy('create', 'Post')
  @Post()
  @ApiCreatedResponse({ type: PostResponseDto })
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @CurrentActor() actor: Actor,
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
    const command = dto.toCommand(actor, files);
    const postId = await this.commandBus.execute(command);
    const post = await this.queryBus.execute(new GetPostQuery(postId, actor));
    return new PostResponseDto(post);
  }

  @ApiOperation({ summary: 'Update' })
  @CheckPolicy('update', 'Post')
  @Patch(':id')
  @ApiOkResponse({ type: PostResponseDto })
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdatePostDto,
    @CurrentActor() actor: Actor,
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
    const command = dto.toCommand(actor, id, files);
    const postId = await this.commandBus.execute(command);
    const post = await this.queryBus.execute(new GetPostQuery(postId, actor));
    return new PostResponseDto(
      post,
      post.moderationReason ? [post.moderationReason] : undefined,
    );
  }

  @ApiOperation({ summary: 'Delete' })
  @CheckPolicy('delete', 'Post')
  @HttpCode(204)
  @Delete(':id')
  @ApiNoContentResponse()
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentActor() actor: Actor,
  ) {
    const command = new DeletePostCommand(actor, id, false);
    await this.commandBus.execute(command);
    return undefined;
  }

  @ApiOperation({ summary: 'Delete Hard' })
  @CheckPolicy('manage', 'Post')
  @HttpCode(204)
  @Delete(':id/permanent')
  @ApiNoContentResponse()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async removeHard(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentActor() actor: Actor,
  ) {
    const command = new DeletePostCommand(actor, id, true);
    await this.commandBus.execute(command);
    return undefined;
  }

  @ApiOperation({ summary: 'Delete Image' })
  @CheckPolicy('update', 'Post')
  @HttpCode(204)
  @Delete(':id/images')
  @ApiNoContentResponse()
  async removeImage(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body('imageUrl') imageUrl: string,
    @CurrentActor() actor: Actor,
  ) {
    if (!imageUrl) throw new BadRequestException('imageUrl is required');

    const command = new RemovePostImageCommand(actor, id, imageUrl);
    await this.commandBus.execute(command);
  }

  // ===== ADMIN ENDPOINTS =====

  @ApiOperation({ summary: 'Get Flagged Posts' })
  @CheckPolicy('manage', 'Post')
  @Get('admin/flagged')
  @ApiPaginatedResponse(PostResponseDto, 'offset')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getFlaggedPosts(
    @CurrentActor() actor: Actor,
    @Query() query: FlaggedPostsQueryDto,
  ) {
    const flaggedQuery = query.toQuery(actor);
    const result = await this.queryBus.execute(flaggedQuery);
    return { data: PostResponseDto.fromArray(result.data), meta: result.meta };
  }

  @ApiOperation({ summary: 'Get Moderation Stats' })
  @CheckPolicy('manage', 'Post')
  @Get('admin/moderation/stats')
  @ApiOkResponse({ type: PostModerationStatsResponseDto })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getModerationStats(@CurrentActor() actor: Actor) {
    const result = await this.queryBus.execute(
      new GetModerationStatsQuery(actor),
    );
    return PostModerationStatsResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Approve Post' })
  @CheckPolicy('manage', 'Post')
  @Patch('admin/:id/approve')
  @HttpCode(204)
  @ApiNoContentResponse()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async approvePost(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentActor() actor: Actor,
  ) {
    const command = new ApprovePostCommand(id, actor);
    await this.commandBus.execute(command);
    return undefined;
  }

  @ApiOperation({ summary: 'Reject Post' })
  @CheckPolicy('manage', 'Post')
  @HttpCode(204)
  @Delete('admin/:id/reject')
  @ApiNoContentResponse()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async rejectPost(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentActor() actor: Actor,
  ) {
    const command = new RejectPostCommand(id, 'Rejected by admin', actor);
    await this.commandBus.execute(command);
    return undefined;
  }

  @ApiOperation({ summary: 'Bulk Approve Posts' })
  @CheckPolicy('manage', 'Post')
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
  async bulkApprovePosts(
    @Body() dto: BulkPostIdsDto,
    @CurrentActor() actor: Actor,
  ) {
    const results = await Promise.allSettled(
      dto.postIds.map((id) =>
        this.commandBus.execute(new ApprovePostCommand(id, actor)),
      ),
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    return { successCount, total: dto.postIds.length };
  }

  @ApiOperation({ summary: 'Bulk Reject Posts' })
  @CheckPolicy('manage', 'Post')
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
  async bulkRejectPosts(
    @Body() dto: BulkPostIdsDto,
    @CurrentActor() actor: Actor,
  ) {
    const results = await Promise.allSettled(
      dto.postIds.map((id) =>
        this.commandBus.execute(
          new RejectPostCommand(id, 'Rejected by admin', actor),
        ),
      ),
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    return { successCount, total: dto.postIds.length };
  }
}
