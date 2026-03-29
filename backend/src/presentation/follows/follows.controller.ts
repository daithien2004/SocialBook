import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Public } from '@/common/decorators/customize';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

import { CreateFollowDto, FilterFollowDto } from '@/presentation/follows/dto/create-follow.dto';
import { FollowResponseDto, FollowStatsResponseDto, FollowStatusResponseDto } from '@/presentation/follows/dto/follow.response.dto';

import { CreateFollowUseCase } from '@/application/follows/use-cases/create-follow/create-follow.use-case';
import { DeleteFollowUseCase } from '@/application/follows/use-cases/delete-follow/delete-follow.use-case';
import { GetFollowStatusUseCase } from '@/application/follows/use-cases/get-follow-status/get-follow-status.use-case';
import { GetFollowsUseCase } from '@/application/follows/use-cases/get-follows/get-follows.use-case';

import { CreateFollowCommand } from '@/application/follows/use-cases/create-follow/create-follow.command';
import { DeleteFollowCommand } from '@/application/follows/use-cases/delete-follow/delete-follow.command';
import { GetFollowStatusQuery } from '@/application/follows/use-cases/get-follow-status/get-follow-status.query';
import { GetFollowsQuery } from '@/application/follows/use-cases/get-follows/get-follows.query';
import { FollowRepository } from '@/infrastructure/database/repositories/follows/follow.repository';

@Controller('follows')
export class FollowsController {
  constructor(
    private readonly createFollowUseCase: CreateFollowUseCase,
    private readonly getFollowsUseCase: GetFollowsUseCase,
    private readonly getFollowStatusUseCase: GetFollowStatusUseCase,
    private readonly deleteFollowUseCase: DeleteFollowUseCase,
    private readonly followRepository: FollowRepository,
  ) { }

  @Public()
  @Get('following')
  async getFollowingList(@Query('userId') userId: string) {
    const result = await this.followRepository.findByUserWithUserInfo(userId);
    
    return {
      message: 'Get following list successfully',
      data: result.data.map(item => new FollowResponseDto(item)),
      meta: result.meta,
    };
  }

  @Get('followers')
  @UseGuards(JwtAuthGuard)
  async getFollowersList(
    @Query('targetUserId') targetUserId: string,
  ) {
    const result = await this.followRepository.findByTargetWithUserInfo(targetUserId);

    return {
      message: 'Get followers list successfully',
      data: result.data.map(item => new FollowResponseDto(item)),
      meta: result.meta,
    };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(
    @CurrentUser('id') userId: string,
    @Query('targetId') targetId: string,
  ) {
    const query = new GetFollowStatusQuery(userId, targetId);
    const result = await this.getFollowStatusUseCase.execute(query);

    return {
      message: 'Get follow status successfully',
      data: new FollowStatusResponseDto(
        result.userId,
        result.targetId,
        result.isFollowing,
        result.isOwner,
        result.followId
      ),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFollowDto,
  ) {
    const command = new CreateFollowCommand(userId, dto.targetId, dto.status);
    const follow = await this.createFollowUseCase.execute(command);

    return {
      message: 'Follow created successfully',
      data: new FollowResponseDto(follow),
    };
  }

  @Delete(':targetId')
  @UseGuards(JwtAuthGuard)
  async unfollow(
    @CurrentUser('id') userId: string,
    @Param('targetId') targetId: string,
  ) {
    const command = new DeleteFollowCommand(userId, targetId);
    await this.deleteFollowUseCase.execute(command);

    return {
      message: 'Unfollowed successfully',
    };
  }

  @Get('stats')
  @Public()
  async getStats(@Query('userId') userId: string) {
    return {
      message: 'Get follow stats not yet implemented',
      data: new FollowStatsResponseDto(0, 0, 0, 0, []),
    };
  }

  @Get('all')
  @Public()
  async getAll(
    @Query() filter: FilterFollowDto,
  ) {
    const query = new GetFollowsQuery(
      filter.userId,
      filter.targetId,
      filter.page,
      filter.limit
    );
    const result = await this.getFollowsUseCase.execute(query);

    return {
      message: 'Get all follows successfully',
      data: result.data.map(follow => new FollowResponseDto(follow)),
      meta: result.meta,
    };
  }
}
