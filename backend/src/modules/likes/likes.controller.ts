import { Controller, Post, Body, Req } from '@nestjs/common';
import { LikesService } from './likes.service';
import { ToggleLikeDto } from '@/src/modules/likes/dto/create-like.dto';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('toggle')
  async toggleLike(@Req() req: any, @Body() dto: ToggleLikeDto) {
      const userId = req.user.id;
      return this.likesService.toggleLike(userId, dto);
  }
}
