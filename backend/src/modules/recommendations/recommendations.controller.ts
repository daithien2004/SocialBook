// src/modules/recommendations/recommendations.controller.ts
import { Controller, Get, Query, Request } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get('personalized')
  async getPersonalizedRecommendations(
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.id;
    const recommendations =
      await this.recommendationsService.getPersonalizedRecommendations(
        userId,
        limit || 10,
      );

    return {
      message: 'Recommendations generated successfully',
      data: recommendations,
    };
  }
}
