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
  UseGuards,
} from '@nestjs/common';

import { Public } from '@/shared/platform/decorators/custom.decorator';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import type { PaginatedResult } from '@/shared/domain/pagination.types';
import { paginate } from '@/shared/domain/pagination.types';

import {
  CreateFollowDto,
  FilterFollowDto,
} from '@/modules/follows/presentation/dto/create-follow.dto';
import {
  FollowStatusQueryDto,
  FollowersQueryDto,
  FollowingQueryDto,
} from '@/modules/follows/presentation/dto/follow-query.dto';
import {
  FollowResponseDto,
  FollowStatsResponseDto,
  FollowStatusResponseDto,
} from '@/modules/follows/presentation/dto/follow.response.dto';

import { DeleteFollowCommand } from '@/modules/follows/application/commands/delete-follow/delete-follow.command';
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
@UseGuards(PoliciesGuard)
@Controller('follows')
export class FollowsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Get Following List' })
  @CheckPolicy('read', 'Follow')
  @Public()
  @Get('following')
  @ApiPaginatedResponse(FollowResponseDto, 'offset')
  async getFollowingList(
    @CurrentActor() actor: Actor,
    @Query() filter: FollowingQueryDto,
  ): Promise<PaginatedResult<FollowResponseDto>> {
    const result = await this.queryBus.execute(filter.toQuery(actor));
    return paginate(result.items, result.total, filter, (items) =>
      items.map((item) => new FollowResponseDto(item)),
    );
  }

  @ApiOperation({ summary: 'Get Followers List' })
  @CheckPolicy('read', 'Follow')
  @Get('followers')
  @ApiPaginatedResponse(FollowResponseDto, 'offset')
  async getFollowersList(
    @CurrentActor() actor: Actor,
    @Query() filter: FollowersQueryDto,
  ): Promise<PaginatedResult<FollowResponseDto>> {
    const result = await this.queryBus.execute(filter.toQuery(actor));
    return paginate(result.items, result.total, filter, (items) =>
      items.map((item) => new FollowResponseDto(item)),
    );
  }

  @ApiOperation({ summary: 'Get Status' })
  @CheckPolicy('read', 'Follow')
  @Get('status')
  @ApiOkResponse({ type: FollowStatusResponseDto })
  async getStatus(
    @CurrentActor() actor: Actor,
    @Query() filter: FollowStatusQueryDto,
  ): Promise<FollowStatusResponseDto> {
    const result = await this.queryBus.execute(filter.toQuery(actor));

    return new FollowStatusResponseDto(
      result.userId,
      result.targetId,
      result.isFollowing,
      result.isOwner,
      result.followId,
    );
  }

  @ApiOperation({ summary: 'Create' })
  @CheckPolicy('create', 'Follow')
  @Post()
  @ApiCreatedResponse({ type: FollowResponseDto })
  async create(
    @CurrentActor() actor: Actor,
    @Body() dto: CreateFollowDto,
  ): Promise<FollowResponseDto> {
    const follow = await this.commandBus.execute(dto.toCommand(actor));

    return new FollowResponseDto(follow);
  }

  @ApiOperation({ summary: 'Unfollow' })
  @CheckPolicy('update', 'Follow')
  @HttpCode(204)
  @Delete(':targetId')
  @ApiNoContentResponse()
  async unfollow(
    @CurrentActor() actor: Actor,
    @Param('targetId', new ParseUUIDPipe({ version: '4' })) targetId: string,
  ) {
    const command = new DeleteFollowCommand(actor, targetId);
    await this.commandBus.execute(command);

    return undefined;
  }

  @ApiOperation({ summary: 'Get Stats' })
  @CheckPolicy('read', 'Follow')
  @Get('stats')
  @Public()
  @ApiOkResponse({ type: FollowStatsResponseDto })
  getStats() {
    return new FollowStatsResponseDto(0, 0, 0, 0, []);
  }

  @ApiOperation({ summary: 'Get All' })
  @CheckPolicy('read', 'Follow')
  @Get('all')
  @Public()
  @ApiPaginatedResponse(FollowResponseDto, 'offset')
  async getAll(
    @CurrentActor() actor: Actor,
    @Query() filter: FilterFollowDto,
  ): Promise<PaginatedResult<FollowResponseDto>> {
    const result = await this.queryBus.execute(filter.toQuery(actor));
    return paginate(result.items, result.total, filter, (items) =>
      items.map((follow) => new FollowResponseDto(follow)),
    );
  }
}
