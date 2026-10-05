import { Dispatcher } from '@/application/common/dispatcher';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { Public } from '@/common/decorators/custom.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

import {
  CreateFollowDto,
  FilterFollowDto,
} from '@/presentation/follows/dto/create-follow.dto';
import {
  FollowResponseDto,
  FollowStatsResponseDto,
  FollowStatusResponseDto,
} from '@/presentation/follows/dto/follow.response.dto';

import { CreateFollowCommand } from '@/application/follows/commands/create-follow/create-follow.command';
import { DeleteFollowCommand } from '@/application/follows/commands/delete-follow/delete-follow.command';
import { GetFollowStatusQuery } from '@/application/follows/queries/get-follow-status/get-follow-status.query';
import { GetFollowsQuery } from '@/application/follows/queries/get-follows/get-follows.query';
import { GetFollowingQuery } from '@/application/follows/queries/get-following-with-user-info/get-following.query';
import { GetFollowersQuery } from '@/application/follows/queries/get-followers-with-user-info/get-followers.query';

@Controller('follows')
export class FollowsController {
  constructor(private readonly dispatcher: Dispatcher) {}

  @Public()
  @Get('following')
  async getFollowingList(@Query('userId') userId: string) {
    const query = new GetFollowingQuery(userId);
    const result = await this.dispatcher.query(query);

    return {
      message: 'Get following list successfully',
      data: result.data.map((item) => new FollowResponseDto(item)),
      meta: result.meta,
    };
  }

  @Get('followers')
  async getFollowersList(@Query('targetUserId') targetUserId: string) {
    const query = new GetFollowersQuery(targetUserId);
    const result = await this.dispatcher.query(query);

    return {
      message: 'Get followers list successfully',
      data: result.data.map((item) => new FollowResponseDto(item)),
      meta: result.meta,
    };
  }

  @Get('status')
  async getStatus(
    @CurrentUser('id') userId: string,
    @Query('targetId') targetId: string,
  ) {
    const query = new GetFollowStatusQuery(userId, targetId);
    const result = await this.dispatcher.query(query);

    return {
      message: 'Get follow status successfully',
      data: new FollowStatusResponseDto(
        result.userId,
        result.targetId,
        result.isFollowing,
        result.isOwner,
        result.followId,
      ),
    };
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFollowDto,
  ) {
    const command = new CreateFollowCommand(userId, dto.targetId, dto.status);
    const follow = await this.dispatcher.command(command);

    return {
      message: 'Follow created successfully',
      data: new FollowResponseDto(follow),
    };
  }

  @Delete(':targetId')
  async unfollow(
    @CurrentUser('id') userId: string,
    @Param('targetId') targetId: string,
  ) {
    const command = new DeleteFollowCommand(userId, targetId);
    await this.dispatcher.command(command);

    return {
      message: 'Unfollowed successfully',
    };
  }

  @Get('stats')
  @Public()
  getStats() {
    return {
      message: 'Get follow stats not yet implemented',
      data: new FollowStatsResponseDto(0, 0, 0, 0, []),
    };
  }

  @Get('all')
  @Public()
  async getAll(@Query() filter: FilterFollowDto) {
    const query = new GetFollowsQuery(
      filter.userId,
      filter.targetId,
      filter.actualPage,
      filter.actualLimit,
    );
    const result = await this.dispatcher.query(query);

    return {
      message: 'Get all follows successfully',
      data: result.data.map((follow) => new FollowResponseDto(follow)),
      meta: result.meta,
    };
  }
}
