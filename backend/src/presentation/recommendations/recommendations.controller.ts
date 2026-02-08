import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetPersonalizedRecommendationsUseCase } from '@/application/recommendations/use-cases/get-personalized-recommendations.use-case';

@ApiTags('Recommendations')
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecommendationsController {
  constructor(
    private readonly getPersonalizedRecommendationsUseCase: GetPersonalizedRecommendationsUseCase,
  ) {}

  @Get('personalized')
  @ApiOperation({ summary: 'Get personalized book recommendations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPersonalizedRecommendations(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const userId = req.user.id;
    const result = await this.getPersonalizedRecommendationsUseCase.execute(userId, page, limit);

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
        }
    };
  }
}
