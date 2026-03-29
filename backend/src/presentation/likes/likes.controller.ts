import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';

import { GetLikeCountUseCase } from '@/application/likes/use-cases/get-like-count/get-like-count.use-case';
import { GetLikeStatusUseCase } from '@/application/likes/use-cases/get-like-status/get-like-status.use-case';
import { ToggleLikeUseCase } from '@/application/likes/use-cases/toggle-like/toggle-like.use-case';
import { RequireAuth } from '@/common/decorators/auth-swagger.decorator';
import { Public } from '@/common/decorators/customize';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('likes')
export class LikesController {
  constructor(
    private readonly toggleLikeUseCase: ToggleLikeUseCase,
    private readonly getLikeCountUseCase: GetLikeCountUseCase,
    private readonly getLikeStatusUseCase: GetLikeStatusUseCase,
  ) { }

  @Post('toggle')
  @RequireAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggle(
    @CurrentUser('id') userId: string,
    @Body() dto: { targetId: string; targetType: string }
  ) {
    const result = await this.toggleLikeUseCase.execute({
      userId,
      targetId: dto.targetId,
      targetType: dto.targetType as TargetType,
    });

    return {
      message: result.isLiked ? 'Liked successfully' : 'Unliked successfully',
      data: result,
    };
  }

  @Public()
  @Get('count')
  @HttpCode(HttpStatus.OK)
  async getCount(@Query() dto: { targetId: string; targetType: string }) {
    const data = await this.getLikeCountUseCase.execute({
      targetId: dto.targetId,
      targetType: dto.targetType as TargetType,
    });
    return {
      message: 'Get like count successfully',
      data,
    };
  }

  @Get('status')
  @RequireAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getStatus(
    @CurrentUser('id') userId: string,
    @Query() dto: { targetId: string; targetType: string }
  ) {
    const data = await this.getLikeStatusUseCase.execute({
      userId,
      targetId: dto.targetId,
      targetType: dto.targetType as TargetType,
    });
    return {
      message: 'Get like status successfully',
      data,
    };
  }
}
