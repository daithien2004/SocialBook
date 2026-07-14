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

import { CreateCommentUseCase } from '@/application/comments/use-cases/create-comment/create-comment.use-case';
import { DeleteCommentUseCase } from '@/application/comments/use-cases/delete-comment/delete-comment.use-case';
import { GetCommentCountUseCase } from '@/application/comments/use-cases/get-comment-count/get-comment-count.use-case';
import { GetCommentsUseCase } from '@/application/comments/use-cases/get-comments/get-comments.use-case';
import { ModerateCommentUseCase } from '@/application/comments/use-cases/moderate-comment/moderate-comment.use-case';
import { UpdateCommentUseCase } from '@/application/comments/use-cases/update-comment/update-comment.use-case';

import { CreateCommentCommand } from '@/application/comments/use-cases/create-comment/create-comment.command';
import { DeleteCommentCommand } from '@/application/comments/use-cases/delete-comment/delete-comment.command';
import { GetCommentCountQuery } from '@/application/comments/use-cases/get-comment-count/get-comment-count.query';
import { GetCommentsQuery } from '@/application/comments/use-cases/get-comments/get-comments.query';
import { ModerateCommentCommand } from '@/application/comments/use-cases/moderate-comment/moderate-comment.command';
import { UpdateCommentCommand } from '@/application/comments/use-cases/update-comment/update-comment.command';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly getUsersUseCase: GetCommentsUseCase,
    private readonly getCommentCountUseCase: GetCommentCountUseCase,
    private readonly updateCommentUseCase: UpdateCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly moderateCommentUseCase: ModerateCommentUseCase,
  ) {}

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

    const comment = await this.createCommentUseCase.execute(command);

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
    const result = await this.getUsersUseCase.execute(getQuery);

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
    const result = await this.getCommentCountUseCase.execute(countQuery);

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
    @Body() dto: UpdateCommentDto,
  ) {
    const command = new UpdateCommentCommand(id, userId, dto.content);

    const comment = await this.updateCommentUseCase.execute(command);

    return {
      message: 'Comment updated successfully',
      data: new CommentResponseDto(comment),
    };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    const isAdmin = user.role === 'admin';
    const command = new DeleteCommentCommand(id, user.id, isAdmin);

    await this.deleteCommentUseCase.execute(command);

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

    await this.moderateCommentUseCase.execute(command);

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
