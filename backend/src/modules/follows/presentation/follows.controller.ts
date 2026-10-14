import { ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import {
  HttpCode,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';

import { Public } from '@/shared/platform/decorators/custom.decorator';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';

import {
  CreateFollowDto,
  FilterFollowDto,
} from '@/modules/follows/presentation/dto/create-follow.dto';
import {
  FollowResponseDto,
  FollowStatsResponseDto,
  FollowStatusResponseDto,
} from '@/modules/follows/presentation/dto/follow.response.dto';

import { CreateFollowCommand } from '@/modules/follows/application/commands/create-follow/create-follow.command';
import { DeleteFollowCommand } from '@/modules/follows/application/commands/delete-follow/delete-follow.command';
import { GetFollowStatusQuery } from '@/modules/follows/application/queries/get-follow-status/get-follow-status.query';
import { GetFollowsQuery } from '@/modules/follows/application/queries/get-follows/get-follows.query';
import { GetFollowingQuery } from '@/modules/follows/application/queries/get-following-with-user-info/get-following.query';
import { GetFollowersQuery } from '@/modules/follows/application/queries/get-followers-with-user-info/get-followers.query';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@ApiProblemResponses()
@ApiTags('Follows')
@Controller('follows')
export class FollowsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Get Following List' })
  @Public()
  @Get('following')
  @ApiPaginatedResponse(FollowResponseDto, 'offset')
  async getFollowingList(@Query('userId') userId: string) {
    const query = new GetFollowingQuery(userId);
    const result = await this.queryBus.execute(query);

    return {
      data: result.data.map((item) => new FollowResponseDto(item)),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: 'Get Followers List' })
  @Get('followers')
  @ApiPaginatedResponse(FollowResponseDto, 'offset')
  async getFollowersList(@Query('targetUserId') targetUserId: string) {
    const query = new GetFollowersQuery(targetUserId);
    const result = await this.queryBus.execute(query);

    return {
      data: result.data.map((item) => new FollowResponseDto(item)),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: 'Get Status' })
  @Get('status')
  @ApiOkResponse({ type: FollowStatusResponseDto })
  async getStatus(
    @CurrentUser('id') userId: string,
    @Query('targetId') targetId: string,
  ) {
    const query = new GetFollowStatusQuery(userId, targetId);
    const result = await this.queryBus.execute(query);

    return new FollowStatusResponseDto(
      result.userId,
      result.targetId,
      result.isFollowing,
      result.isOwner,
      result.followId,
    );
  }

  @ApiOperation({ summary: 'Create' })
  @Post()
  @ApiCreatedResponse({ type: FollowResponseDto })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFollowDto,
  ) {
    const command = new CreateFollowCommand(userId, dto.targetId, dto.status);
    const follow = await this.commandBus.execute(command);

    return new FollowResponseDto(follow);
  }

  @ApiOperation({ summary: 'Unfollow' })
  @HttpCode(204)
  @Delete(':targetId')
  @ApiNoContentResponse()
  async unfollow(
    @CurrentUser('id') userId: string,
    @Param('targetId', new ParseUUIDPipe({ version: '4' })) targetId: string,
  ) {
    const command = new DeleteFollowCommand(userId, targetId);
    await this.commandBus.execute(command);

    return undefined;
  }

  @ApiOperation({ summary: 'Get Stats' })
  @Get('stats')
  @Public()
  @ApiOkResponse({ type: FollowStatsResponseDto })
  getStats() {
    return new FollowStatsResponseDto(0, 0, 0, 0, []);
  }

  @ApiOperation({ summary: 'Get All' })
  @Get('all')
  @Public()
  @ApiPaginatedResponse(FollowResponseDto, 'offset')
  async getAll(@Query() filter: FilterFollowDto) {
    const query = new GetFollowsQuery(
      filter.userId,
      filter.targetId,
      filter.actualPage,
      filter.actualLimit,
    );
    const result = await this.queryBus.execute(query);

    return {
      data: result.data.map((follow) => new FollowResponseDto(follow)),
      meta: result.meta,
    };
  }
}
