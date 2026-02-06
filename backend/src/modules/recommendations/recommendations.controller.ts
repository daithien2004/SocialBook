import {
  Controller,
  Get,
  Query,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) { }

  @Get('personalized')
  @UseGuards(JwtAuthGuard)
  async getPersonalizedRecommendations(
    @Req() req: Request & { user: { id: string } },
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
