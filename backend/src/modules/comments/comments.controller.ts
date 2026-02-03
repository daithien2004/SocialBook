import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus, Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CommentsService } from './comments.service';
import { Types } from 'mongoose';

import { Public } from '@/src/common/decorators/customize';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

import { CommentCountDto, CreateCommentDto, UpdateCommentDto } from './dto/create-comment.dto';
import { GetCommentsDto, ResolveParentQueryDto } from './dto/get-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request & { user: { id: string } }, @Body() dto: CreateCommentDto) {
    const data = await this.commentsService.create(req.user.id, dto);
    return {
      message: 'Comment created successfully',
      data,
    };
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get('target')
  @HttpCode(HttpStatus.OK)
  async getByTarget(@Req() req: Request & { user: { id: string } }, @Query() query: GetCommentsDto) {
    const { targetId, parentId, cursor, limit } = query;

    const result = await this.commentsService.findByTarget(
      targetId,
      parentId ?? null,
      cursor,
      limit ? +limit : 10,
      req.user?.id,
    );

    return {
      message: 'Get comments successfully',
      ...result,
    };
  }

  @Public()
  @Get('count-by-parent/:parentId')
  @HttpCode(HttpStatus.OK)
  async countByParent(
    @Param('parentId') parentId: string,
  ) {
    const count = await this.commentsService.countByParentId(parentId);

    return {
      message: 'Get reply count successfully',
      data: {
        parentId,
        count,
      },
    };
  }


  @Public()
  @Get('resolve-parent')
  @HttpCode(HttpStatus.OK)
  async resolveParent(@Query() query: ResolveParentQueryDto) {
    const { targetId, targetType, parentId } = query;

    const result = await this.commentsService.resolveParentId(
      new Types.ObjectId(targetId),
      targetType,
      parentId,
    );

    return {
      message: 'Resolve parent successfully',
      data: result,
    };
  }

  @Public()
  @Get('count')
  @HttpCode(HttpStatus.OK)
  async getCount(@Query() dto: CommentCountDto) {
    const data = await this.commentsService.getCommentCount(dto);
    return {
      message: 'Get like count successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/edit')
  @HttpCode(HttpStatus.OK)
  async updateComment(
    @Req() req: Request & { user: { id: string } },
    @Param('id') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    const data = await this.commentsService.updateComment(
      req.user.id,
      commentId,
      dto.content,
    );

    return {
      message: 'Comment updated successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/delete')
  @HttpCode(HttpStatus.OK)
  async deleteComment(
    @Req() req: Request & { user: { id: string } },
    @Param('id') commentId: string,
  ) {
    await this.commentsService.deleteComment(req.user.id, commentId);

    return {
      message: 'Comment deleted successfully',
    };
  }
}
