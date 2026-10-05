import { Dispatcher } from '@/application/common/dispatcher';

import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';
import { GetPersonalizedRecommendationsQuery } from '@/application/recommendations/queries/get-personalized-recommendations/get-personalized-recommendations.query';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly dispatcher: Dispatcher,

    ) {}

  @Get('personalized')
  async getPersonalizedRecommendations(
    @Req() req: Request,
    @Query() filter: GetRecommendationsDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    const query = new GetPersonalizedRecommendationsQuery(
      userId,
      filter.actualPage,
      filter.actualLimit,
    );
    const result = await this.dispatcher.query(query);

    return {
      message: 'Recommendations generated successfully',
      data: {
        recommendations: result.recommendations,
        analysis: result.analysis,
        meta: result.meta,
      },
    };
  }
}
