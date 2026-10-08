import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ToggleLikeCommand } from '@/modules/likes/application/commands/toggle-like/toggle-like.command';
import { GetLikeCountQuery } from '@/modules/likes/application/queries/get-like-count/get-like-count.query';
import { GetLikeStatusQuery } from '@/modules/likes/application/queries/get-like-status/get-like-status.query';

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
import { TargetType } from '@/modules/likes/domain/value-objects/target-type.vo';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('likes')
export class LikesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('toggle')
  @RequireAuth()
  @HttpCode(HttpStatus.OK)
  async toggle(
    @CurrentUser('id') userId: string,
    @Body() dto: { targetId: string; targetType: string },
  ) {
    const result = await this.commandBus.execute(
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
    const data = await this.queryBus.execute(
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
    const data = await this.queryBus.execute(
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
