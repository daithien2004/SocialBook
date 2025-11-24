import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { ToggleLikeDto } from './dto/create-like.dto';

import { Public } from '@/src/common/decorators/customize';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggle(@Req() req: any, @Body() dto: ToggleLikeDto) {
    const result = await this.likesService.toggle(req.user.id, dto);

    return {
      message: result.isLiked ? 'Liked successfully' : 'Unliked successfully',
      data: result,
    };
  }

  @Public()
  @Get('count')
  @HttpCode(HttpStatus.OK)
  async getCount(@Query() dto: ToggleLikeDto) {
    const data = await this.likesService.getCount(dto);
    return {
      message: 'Get like count successfully',
      data,
    };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getStatus(@Req() req: any, @Query() dto: ToggleLikeDto) {
    const data = await this.likesService.checkStatus(req.user.id, dto);
    return {
      message: 'Get like status successfully',
      data,
    };
  }
}
