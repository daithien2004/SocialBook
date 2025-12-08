import {
  Controller,
  Get,
  Query,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get('personalized')
  async getPersonalizedRecommendations(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const userId = req.user.id;
    const result =
      await this.recommendationsService.getPersonalizedRecommendations(
        userId,
        page,
        limit,
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
