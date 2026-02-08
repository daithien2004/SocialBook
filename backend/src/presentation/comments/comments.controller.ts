import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

import { Public } from '@/common/decorators/customize';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CreateCommentDto, UpdateCommentDto, CommentCountDto, ModerateCommentDto, FlagCommentDto } from '@/application/comments/dto/create-comment.dto';
import { FilterCommentDto, GetCommentsDto } from '@/application/comments/dto/filter-comment.dto';
import { CommentResponseDto, CommentWithRepliesDto, CommentStatsDto } from '@/application/comments/dto/comment.response.dto';

import { CreateCommentUseCase } from '@/application/comments/use-cases/create-comment/create-comment.use-case';
import { GetCommentsUseCase } from '@/application/comments/use-cases/get-comments/get-comments.use-case';
import { UpdateCommentUseCase } from '@/application/comments/use-cases/update-comment/update-comment.use-case';
import { DeleteCommentUseCase } from '@/application/comments/use-cases/delete-comment/delete-comment.use-case';
import { ModerateCommentUseCase } from '@/application/comments/use-cases/moderate-comment/moderate-comment.use-case';

import { CreateCommentCommand } from '@/application/comments/use-cases/create-comment/create-comment.command';
import { GetCommentsCommand } from '@/application/comments/use-cases/get-comments/get-comments.command';
import { UpdateCommentCommand } from '@/application/comments/use-cases/update-comment/update-comment.command';
import { DeleteCommentCommand } from '@/application/comments/use-cases/delete-comment/delete-comment.command';
import { ModerateCommentCommand } from '@/application/comments/use-cases/moderate-comment/moderate-comment.command';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly getCommentsUseCase: GetCommentsUseCase,
    private readonly updateCommentUseCase: UpdateCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly moderateCommentUseCase: ModerateCommentUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiBody({ type: CreateCommentDto })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get comments for a target' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async getByTarget(@Query() query: GetCommentsDto) {
    const command = new GetCommentsCommand(
      query.targetId,
      query.targetType,
      query.parentId,
      query.page,
      query.limit,
      query.cursor,
      query.sortBy as any,
      query.order as any
    );
    
    const result = await this.getCommentsUseCase.execute(command);
    
    return {
      message: 'Comments retrieved successfully',
      data: {
        comments: result.data.map(comment => new CommentResponseDto(comment)),
        meta: result.meta,
      },
    };
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  async getById(@Param('id') id: string) {
    // This would need a GetCommentByIdUseCase to be implemented
    return {
      message: 'Get comment by ID not yet implemented',
      data: null,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiBody({ type: UpdateCommentDto })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  async remove(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string; roles?: string[] }
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flag a comment for moderation' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiBody({ type: FlagCommentDto })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Moderate a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiBody({ type: ModerateCommentDto })
  async moderate(@Param('id') id: string, @Body() dto: ModerateCommentDto) {
    const command = new ModerateCommentCommand(id, dto.status, dto.reason);
    
    await this.moderateCommentUseCase.execute(command);
    
    return {
      message: `Comment ${dto.status} successfully`,
    };
  }

  @Get('count')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get comment count for a target' })
  @ApiQuery({ name: 'targetId', description: 'Target ID' })
  @ApiQuery({ name: 'targetType', description: 'Target type' })
  async getCount(@Query() query: CommentCountDto) {
    // This would need a GetCommentCountUseCase to be implemented
    return {
      message: 'Get comment count not yet implemented',
      data: { count: 0 },
    };
  }

  @Get('stats')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get comment statistics' })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get comments pending moderation' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPendingModeration(@Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    // This would need a GetPendingModerationUseCase to be implemented
    return {
      message: 'Get pending moderation not yet implemented',
      data: { comments: [], meta: { current: 1, pageSize: 10, total: 0, totalPages: 0 } },
    };
  }

  @Get('moderation/flagged')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get flagged comments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFlagged(@Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    // This would need a GetFlaggedCommentsUseCase to be implemented
    return {
      message: 'Get flagged comments not yet implemented',
      data: { comments: [], meta: { current: 1, pageSize: 10, total: 0, totalPages: 0 } },
    };
  }
}
