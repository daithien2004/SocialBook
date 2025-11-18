import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  GetCommentsDto,
  ResolveParentQueryDto,
} from '@/src/modules/comments/dto/get-comment.dto';
import { Types } from 'mongoose';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async postCreate(
    @Req() req: any,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return await this.commentsService.createForTarget(req.user.id, createCommentDto);
  }

  @Get('resolve-parent')
  async getResolveParent(@Query() query: ResolveParentQueryDto) {
    const { targetId, targetType, parentId } = query;
    const targetObjectId = new Types.ObjectId(targetId);

    return await this.commentsService.resolveParentId(
      targetObjectId,
      targetType,
      parentId,
    );
  }

  @Get('target')
  async getCommentByTarget(@Query() query: GetCommentsDto) {
    const { targetId, parentId, cursor, limit } = query;
    return await this.commentsService.getCommentByTarget(
      targetId,
      parentId ?? null,
      cursor,
      limit,
    );
  }
}
