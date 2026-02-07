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
import { Request } from 'express';
import { ToggleLikeUseCase } from '../application/use-cases/toggle-like/toggle-like.use-case';
import { GetLikeCountUseCase } from '../application/use-cases/get-like-count/get-like-count.use-case';
import { GetLikeStatusUseCase } from '../application/use-cases/get-like-status/get-like-status.use-case';
import { TargetType } from '../domain/value-objects/target-type.vo';
import { Public } from '../../../common/decorators/customize';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('likes')
export class LikesController {
  constructor(
    private readonly toggleLikeUseCase: ToggleLikeUseCase,
    private readonly getLikeCountUseCase: GetLikeCountUseCase,
    private readonly getLikeStatusUseCase: GetLikeStatusUseCase,
  ) {}

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggle(@Req() req: Request & { user: { id: string } }, @Body() dto: { targetId: string; targetType: string }) {
    const result = await this.toggleLikeUseCase.execute({
      userId: req.user.id,
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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getStatus(@Req() req: Request & { user: { id: string } }, @Query() dto: { targetId: string; targetType: string }) {
    const data = await this.getLikeStatusUseCase.execute({
      userId: req.user.id,
      targetId: dto.targetId,
      targetType: dto.targetType as TargetType,
    });
    return {
      message: 'Get like status successfully',
      data,
    };
  }
}
