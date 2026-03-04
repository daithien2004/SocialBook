import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';


import { Public } from '@/common/decorators/customize';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CommentResponseDto, CommentStatsDto } from '@/presentation/comments/dto/comment.response.dto';
import { CommentCountDto, CreateCommentDto, FlagCommentDto, ModerateCommentDto, UpdateCommentDto } from '@/presentation/comments/dto/create-comment.dto';
import { FilterCommentDto, GetCommentsDto } from '@/presentation/comments/dto/filter-comment.dto';

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
    private readonly getCommentsUseCase: GetCommentsUseCase,
    private readonly getCommentCountUseCase: GetCommentCountUseCase,
    private readonly updateCommentUseCase: UpdateCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly moderateCommentUseCase: ModerateCommentUseCase,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: Request & { user: { id: string } }, @Body() dto: CreateCommentDto) {
    const command = new CreateCommentCommand(
      req.user.id,
      dto.targetType,
      dto.targetId,
      dto.content,
      dto.parentId
    );

    const comment = await this.createCommentUseCase.execute(command);

    return {
      message: 'Comment created successfully',
      data: new CommentResponseDto(comment),
    };
  }

  @Public()
  @Get('target')
  async getByTarget(@Query() query: GetCommentsDto) {
    const getQuery = new GetCommentsQuery(
      query.targetId,
      query.parentId,
      query.page,
      query.limit,
      query.cursor,
      query.sortBy as any,
      query.order as any
    );
    const result = await this.getCommentsUseCase.execute(getQuery);

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
  async getById(@Param('id') id: string) {
    return {
      message: 'Get comment by ID not yet implemented',
      data: null,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateCommentDto
  ) {
    const command = new UpdateCommentCommand(id, req.user.id, dto.content);

    const comment = await this.updateCommentUseCase.execute(command);

    return {
      message: 'Comment updated successfully',
      data: new CommentResponseDto(comment),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id') id: string,
    @Req() req: Request & {
      user: { id: string; roles?: string[] }
    }) {
    const isAdmin = req.user.roles?.includes('admin') || false;
    const command = new DeleteCommentCommand(id, req.user.id, isAdmin);

    await this.deleteCommentUseCase.execute(command);

    return {
      message: 'Comment deleted successfully',
    };
  }

  @Post(':id/flag')
  @UseGuards(JwtAuthGuard)
  async flag(@Param('id') id: string, @Body() dto: FlagCommentDto) {
    // This would need a FlagCommentUseCase to be implemented
    return {
      message: 'Flag comment not yet implemented',
      data: null,
    };
  }

  @Post(':id/moderate')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async moderate(@Param('id') id: string, @Body() dto: ModerateCommentDto) {
    const command = new ModerateCommentCommand(id, dto.status, dto.reason);

    await this.moderateCommentUseCase.execute(command);

    return {
      message: `Comment ${dto.status} successfully`,
    };
  }

  @Get('stats')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getStats() {
    // This would need a GetCommentStatsUseCase to be implemented
    return {
      message: 'Get comment stats not yet implemented',
      data: new CommentStatsDto(0, 0, 0, 0, 0, {}),
    };
  }

  @Get('moderation/pending')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getPendingModeration(@Query() filter: FilterCommentDto) {
    // This would need a GetPendingModerationUseCase to be implemented
    return {
      message: 'Get pending moderation not yet implemented',
      data: { comments: [], meta: { current: 1, pageSize: 10, total: 0, totalPages: 0 } },
    };
  }

  @Get('moderation/flagged')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getFlagged(@Query() filter: FilterCommentDto) {
    // This would need a GetFlaggedCommentsUseCase to be implemented
    return {
      message: 'Get flagged comments not yet implemented',
      data: { comments: [], meta: { current: 1, pageSize: 10, total: 0, totalPages: 0 } },
    };
  }
}
