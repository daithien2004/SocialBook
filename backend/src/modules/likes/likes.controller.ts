import { Controller, Post, Body, Req, Get, Param, Query } from '@nestjs/common';
import { LikesService } from './likes.service';
import { ToggleLikeDto } from '@/src/modules/likes/dto/create-like.dto';
import { GetCommentsDto } from '@/src/modules/comments/dto/get-comment.dto';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('toggle')
  async postToggleLike(@Req() req: any, @Body() dto: ToggleLikeDto) {
      const userId = req.user.id;
      return await this.likesService.toggleLike(userId, dto);
  }

  @Get('count')
  async getCountByTarget(@Query() dto: ToggleLikeDto) {
      return await this.likesService.countByTarget(dto);
  }
}
