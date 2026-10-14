import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { GetRateLimitConfigQuery } from '../application/queries/get-rate-limit-config/get-rate-limit-config.query';
import type { AIRateLimitConfigReadModel } from '../application/read-models/ai-rate-limit-config.read-model';
import { AIRateLimitConfigResponseDto } from './dto/ai-rate-limit-config.response.dto';
import { UpdateRateLimitDto } from './dto/update-rate-limit.dto';

@ApiTags('Admin Rate Limits')
@ApiBearerAuth()
@UseGuards(PoliciesGuard)
@ApiProblemResponses([500])
@Controller('admin/rate-limits')
export class AdminRateLimitController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('ai')
  @CheckPolicy('read', 'AIRateLimitConfiguration')
  @ApiProblemResponses([401, 403])
  @ApiOperation({ summary: 'Get AI rate limit configuration' })
  @ApiOkResponse({ type: AIRateLimitConfigResponseDto })
  async getAIConfig(
    @CurrentActor() actor: Actor,
  ): Promise<AIRateLimitConfigResponseDto> {
    const result = await this.queryBus.execute<AIRateLimitConfigReadModel>(
      new GetRateLimitConfigQuery(actor),
    );
    return AIRateLimitConfigResponseDto.fromReadModel(result);
  }

  @Put('ai')
  @CheckPolicy('update', 'AIRateLimitConfiguration')
  @ApiProblemResponses([400, 401, 403])
  @ApiOperation({ summary: 'Update AI rate limit configuration' })
  @ApiOkResponse({ type: AIRateLimitConfigResponseDto })
  async updateAIConfig(
    @CurrentActor() actor: Actor,
    @Body() dto: UpdateRateLimitDto,
  ): Promise<AIRateLimitConfigResponseDto> {
    await this.commandBus.execute(dto.toCommand(actor));
    const result = await this.queryBus.execute<AIRateLimitConfigReadModel>(
      new GetRateLimitConfigQuery(actor),
    );
    return AIRateLimitConfigResponseDto.fromReadModel(result);
  }
}
