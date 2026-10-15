import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { LikeTargetQueryDto } from './dto/like-target.query.dto';
import { ToggleLikeDto } from './dto/toggle-like.dto';
import {
  LikeCountResponseDto,
  LikeStatusResponseDto,
  ToggleLikeResponseDto,
} from './dto/like.response.dto';

@ApiProblemResponses()
@ApiTags('Likes')
@UseGuards(PoliciesGuard)
@Controller('likes')
export class LikesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Toggle a like' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: ToggleLikeResponseDto })
  @CheckPolicy('like', 'Like')
  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  async toggle(
    @CurrentActor() actor: Actor,
    @Body() dto: ToggleLikeDto,
  ): Promise<ToggleLikeResponseDto> {
    const result = await this.commandBus.execute(dto.toCommand(actor));
    return ToggleLikeResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Get like count' })
  @ApiOkResponse({ type: LikeCountResponseDto })
  @CheckPolicy('read', 'Like')
  @Public()
  @Get('count')
  @HttpCode(HttpStatus.OK)
  async getCount(
    @CurrentActor() actor: Actor,
    @Query() dto: LikeTargetQueryDto,
  ): Promise<LikeCountResponseDto> {
    const result = await this.queryBus.execute(dto.toCountQuery(actor));
    return LikeCountResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: "Get current user's like status" })
  @ApiBearerAuth()
  @ApiOkResponse({ type: LikeStatusResponseDto })
  @CheckPolicy('read', 'Like')
  @Get('status')
  @HttpCode(HttpStatus.OK)
  async getStatus(
    @CurrentActor() actor: Actor,
    @Query() dto: LikeTargetQueryDto,
  ): Promise<LikeStatusResponseDto> {
    const result = await this.queryBus.execute(dto.toStatusQuery(actor));
    return LikeStatusResponseDto.fromResult(result);
  }
}
