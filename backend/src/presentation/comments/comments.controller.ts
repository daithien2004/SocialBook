import { Comment } from '@/domain/comments/entities/comment.entity';
import { Dispatcher } from '@/application/common/dispatcher';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Public } from '@/common/decorators/custom.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentAbility } from '@/common/decorators/current-ability.decorator';
import type { AppAbility } from '@socialbook/shared';

import {
  CommentResponseDto,
  CommentStatsDto,
} from '@/presentation/comments/dto/comment.response.dto';
import {
  CommentCountDto,
  CreateCommentDto,
  ModerateCommentDto,
  UpdateCommentDto,
} from '@/presentation/comments/dto/create-comment.dto';
import { GetCommentsDto } from '@/presentation/comments/dto/filter-comment.dto';

import { CreateCommentCommand } from '@/application/comments/commands/create-comment/create-comment.command';
import { DeleteCommentCommand } from '@/application/comments/commands/delete-comment/delete-comment.command';
import { GetCommentCountQuery } from '@/application/comments/queries/get-comment-count/get-comment-count.query';
import { GetCommentsQuery } from '@/application/comments/queries/get-comments/get-comments.query';
import { ModerateCommentCommand } from '@/application/comments/commands/moderate-comment/moderate-comment.command';
import { UpdateCommentCommand } from '@/application/comments/commands/update-comment/update-comment.command';

@Controller('comments')
export class CommentsController {
  constructor(private readonly dispatcher: Dispatcher) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    const command = new CreateCommentCommand(
      userId,
      dto.targetType,
      dto.targetId,
      dto.content,
      dto.parentId,
    );

    const comment = await this.dispatcher.command(command);

    return {
      message: 'Comment created successfully',
      data: new CommentResponseDto(comment),
    };
  }

  @Public()
  @Get('target')
  async getByTarget(
    @CurrentUser('id') userId: string | undefined,
    @Query() query: GetCommentsDto,
  ) {
    const getQuery = new GetCommentsQuery(
      query.targetId,
      query.parentId,
      query.page,
      query.limit,
      query.cursor,
      query.sortBy as 'createdAt' | 'updatedAt' | 'likesCount' | undefined,
      query.order,
      userId,
    );
    const result = await this.dispatcher.query(getQuery);

    return {
      message: 'Comments retrieved successfully',
      data: {
        comments: result.data,
        meta: result.meta,
      },
    };
  }

  @Public()
  @Get('count')
  async getCount(@Query() query: CommentCountDto) {
    const countQuery = new GetCommentCountQuery(
      query.targetId,
      query.targetType,
      query.parentId,
    );
    const result = await this.dispatcher.query(countQuery);

    return {
      message: 'Comment count retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @Public()
  getById() {
    return {
      message: 'Get comment by ID not yet implemented',
      data: null,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentAbility() ability: AppAbility,
    @Body() dto: UpdateCommentDto,
  ) {
    const command = new UpdateCommentCommand(id, userId, ability, dto.content);

    const comment = await this.dispatcher.command(command);

    return {
      message: 'Comment updated successfully',
      data: new CommentResponseDto(comment),
    };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    const command = new DeleteCommentCommand(id, userId, ability);

    await this.dispatcher.command(command);

    return {
      message: 'Comment deleted successfully',
    };
  }

  @Post(':id/flag')
  flag() {
    return {
      message: 'Flag comment not yet implemented',
      data: null,
    };
  }

  @Post(':id/moderate')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async moderate(@Param('id') id: string, @Body() dto: ModerateCommentDto) {
    const command = new ModerateCommentCommand(id, dto.status, dto.reason);

    await this.dispatcher.command(command);

    return {
      message: `Comment ${dto.status} successfully`,
    };
  }

  @Get('stats')
  @Roles('admin')
  @UseGuards(RolesGuard)
  getStats() {
    return {
      message: 'Get comment stats not yet implemented',
      data: new CommentStatsDto(0, 0, 0, 0, 0, {}),
    };
  }

  @Get('moderation/pending')
  @Roles('admin')
  @UseGuards(RolesGuard)
  getPendingModeration() {
    return {
      message: 'Get pending moderation not yet implemented',
      data: {
        comments: [],
        meta: { current: 1, pageSize: 10, total: 0, totalPages: 0 },
      },
    };
  }

  @Get('moderation/flagged')
  @Roles('admin')
  @UseGuards(RolesGuard)
  getFlagged() {
    return {
      message: 'Get flagged comments not yet implemented',
      data: {
        comments: [],
        meta: { current: 1, pageSize: 10, total: 0, totalPages: 0 },
      },
    };
  }
}
