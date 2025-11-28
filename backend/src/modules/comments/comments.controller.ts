import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Types } from 'mongoose';

import { Public } from '@/src/common/decorators/customize';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

import { CommentCountDto, CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsDto, ResolveParentQueryDto } from './dto/get-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req: any, @Body() dto: CreateCommentDto) {
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
  async getByTarget(@Request() req: any, @Query() query: GetCommentsDto) {
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
}
