import { GetPersonalizedRecommendationsUseCase } from '@/application/recommendations/use-cases/get-personalized-recommendations.use-case';
import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly getPersonalizedRecommendationsUseCase: GetPersonalizedRecommendationsUseCase,
  ) {}

  @Get('personalized')
  async getPersonalizedRecommendations(
    @Req() req: Request,
    @Query() filter: GetRecommendationsDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    const result = await this.getPersonalizedRecommendationsUseCase.execute({
      userId,
      page: filter.actualPage,
      limit: filter.actualLimit,
    });

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
