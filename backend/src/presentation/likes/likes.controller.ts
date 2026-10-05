import { Dispatcher } from '@/application/common/dispatcher';
import { ToggleLikeCommand } from '@/application/likes/commands/toggle-like/toggle-like.command';
import { GetLikeCountQuery } from '@/application/likes/queries/get-like-count/get-like-count.query';
import { GetLikeStatusQuery } from '@/application/likes/queries/get-like-status/get-like-status.query';

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';

import { RequireAuth } from '@/common/decorators/auth-swagger.decorator';
import { Public } from '@/common/decorators/custom.decorator';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('likes')
export class LikesController {
  constructor(private readonly dispatcher: Dispatcher) {}

  @Post('toggle')
  @RequireAuth()
  @HttpCode(HttpStatus.OK)
  async toggle(
    @CurrentUser('id') userId: string,
    @Body() dto: { targetId: string; targetType: string },
  ) {
    const result = await this.dispatcher.command(
      new ToggleLikeCommand(userId, dto.targetId, dto.targetType as TargetType),
    );

    return {
      message: result.isLiked ? 'Liked successfully' : 'Unliked successfully',
      data: result,
    };
  }

  @Public()
  @Get('count')
  @HttpCode(HttpStatus.OK)
  async getCount(@Query() dto: { targetId: string; targetType: string }) {
    const data = await this.dispatcher.query(
      new GetLikeCountQuery(dto.targetId, dto.targetType as TargetType),
    );
    return {
      message: 'Get like count successfully',
      data,
    };
  }

  @Get('status')
  @RequireAuth()
  @HttpCode(HttpStatus.OK)
  async getStatus(
    @CurrentUser('id') userId: string,
    @Query() dto: { targetId: string; targetType: string },
  ) {
    const data = await this.dispatcher.query(
      new GetLikeStatusQuery(
        userId,
        dto.targetId,
        dto.targetType as TargetType,
      ),
    );
    return {
      message: 'Get like status successfully',
      data,
    };
  }
}
