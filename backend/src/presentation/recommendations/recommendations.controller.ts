import { GetPersonalizedRecommendationsUseCase } from '@/application/recommendations/use-cases/get-personalized-recommendations.use-case';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(
    private readonly getPersonalizedRecommendationsUseCase: GetPersonalizedRecommendationsUseCase,
  ) {}

  @Get('personalized')
  async getPersonalizedRecommendations(
    @Req() req: any,
    @Query() filter: GetRecommendationsDto,
  ) {
    const userId = req.user.id;
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
