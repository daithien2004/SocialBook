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
    const result = await this.getPersonalizedRecommendationsUseCase.execute(
      userId,
      filter.page,
      filter.limit,
    );

    return {
      message: 'Recommendations generated successfully',
      data: {
        recommendations: result.recommendations,
        pagination: {
          currentPage: result.currentPage,
          limit: result.limit,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
        analysis: result.analysis,
      },
    };
  }
}
