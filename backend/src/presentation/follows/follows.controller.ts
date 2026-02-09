import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Req,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

import { Public } from '@/common/decorators/customize';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

import { CreateFollowDto } from '@/presentation/follows/dto/create-follow.dto';
import { FilterFollowDto } from '@/presentation/follows/dto/create-follow.dto';
import { FollowResponseDto, FollowStatusResponseDto, FollowStatsResponseDto } from '@/presentation/follows/dto/follow.response.dto';

import { CreateFollowUseCase } from '@/application/follows/use-cases/create-follow/create-follow.use-case';
import { GetFollowsUseCase } from '@/application/follows/use-cases/get-follows/get-follows.use-case';
import { GetFollowStatusUseCase } from '@/application/follows/use-cases/get-follow-status/get-follow-status.use-case';
import { DeleteFollowUseCase } from '@/application/follows/use-cases/delete-follow/delete-follow.use-case';

import { CreateFollowCommand } from '@/application/follows/use-cases/create-follow/create-follow.command';
import { GetFollowsQuery } from '@/application/follows/use-cases/get-follows/get-follows.query';
import { GetFollowStatusQuery } from '@/application/follows/use-cases/get-follow-status/get-follow-status.query';
import { DeleteFollowCommand } from '@/application/follows/use-cases/delete-follow/delete-follow.command';

@ApiTags('Follows')
@Controller('follows')
export class FollowsController {
  constructor(
    private readonly createFollowUseCase: CreateFollowUseCase,
    private readonly getFollowsUseCase: GetFollowsUseCase,
    private readonly getFollowStatusUseCase: GetFollowStatusUseCase,
    private readonly deleteFollowUseCase: DeleteFollowUseCase,
  ) { }

  @Public()
  @Get('following')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get following list for a user' })
  @ApiQuery({ name: 'userId', description: 'User ID', required: true })
  async getFollowingList(@Query('userId') userId: string) {
    const query = new GetFollowsQuery(userId, undefined, 1, 100);
    const result = await this.getFollowsUseCase.execute(query);

    return {
      message: 'Get following list successfully',
      data: result.data.map(follow => new FollowResponseDto(follow)),
      meta: result.meta,
    };
  }

  @Get('followers')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get followers list for a target user' })
  @ApiQuery({ name: 'targetUserId', description: 'Target User ID', required: true })
  async getFollowersList(
    @Req() req: Request & { user: { id: string } },
    @Query('targetUserId') targetUserId: string,
  ) {
    const query = new GetFollowsQuery(undefined, targetUserId, 1, 100);
    const result = await this.getFollowsUseCase.execute(query);

    return {
      message: 'Get followers list successfully',
      data: result.data.map(follow => new FollowResponseDto(follow)),
      meta: result.meta,
    };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get follow status between current user and target' })
  @ApiQuery({ name: 'targetId', description: 'Target User ID', required: true })
  async getStatus(
    @Req() req: Request & { user: { id: string } },
    @Query('targetId') targetId: string,
  ) {
    const query = new GetFollowStatusQuery(req.user.id, targetId);
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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiBody({ type: CreateFollowDto })
  async create(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateFollowDto,
  ) {
    const command = new CreateFollowCommand(req.user.id, dto.targetId, dto.status);
    const follow = await this.createFollowUseCase.execute(command);

    return {
      message: 'Follow created successfully',
      data: new FollowResponseDto(follow),
    };
  }

  @Delete(':targetId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'targetId', description: 'Target User ID' })
  async unfollow(
    @Req() req: Request & { user: { id: string } },
    @Param('targetId') targetId: string,
  ) {
    const command = new DeleteFollowCommand(req.user.id, targetId);
    await this.deleteFollowUseCase.execute(command);

    return {
      message: 'Unfollowed successfully',
    };
  }

  @Get('stats')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get follow statistics for a user' })
  @ApiQuery({ name: 'userId', description: 'User ID', required: true })
  async getStats(@Query('userId') userId: string) {
    // This would need a GetFollowStatsUseCase to be implemented
    return {
      message: 'Get follow stats not yet implemented',
      data: new FollowStatsResponseDto(0, 0, 0, 0, []),
    };
  }

  @Get('all')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all follows with filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAll(
    @Query() filter: FilterFollowDto,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const query = new GetFollowsQuery(
      filter.userId,
      filter.targetId,
      Number(page),
      Number(limit)
    );
    const result = await this.getFollowsUseCase.execute(query);

    return {
      message: 'Get all follows successfully',
      data: result.data.map(follow => new FollowResponseDto(follow)),
      meta: result.meta,
    };
  }
}
