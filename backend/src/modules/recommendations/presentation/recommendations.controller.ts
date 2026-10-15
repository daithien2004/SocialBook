import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { RecommendationsResponseDto } from './dto/recommendations.response.dto';

@ApiTags('Recommendations')
@UseGuards(PoliciesGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: 'Get Personalized Recommendations' })
  @CheckPolicy('read', 'Recommendation')
  @ApiBearerAuth()
  @Get('personalized')
  @ApiProblemResponses([400, 401, 403, 500])
  @ApiOkResponse({ type: RecommendationsResponseDto })
  async getPersonalizedRecommendations(
    @CurrentActor() actor: Actor,
    @Query() filter: GetRecommendationsDto,
  ): Promise<RecommendationsResponseDto> {
    const query = filter.toQuery(actor);
    const result = await this.queryBus.execute(query);
    return RecommendationsResponseDto.fromReadModel(result);
  }
}
