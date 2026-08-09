import { Injectable } from '@nestjs/common';
import { IRecommendationStrategyProvider } from '@/domain/recommendations/interfaces/recommendation-strategy-provider.interface';
import { IRecommendationDataPort } from '@/domain/recommendations/interfaces/recommendation-data.port';
import {
  RecommendationResponse,
  PaginatedRecommendationResponse,
} from '@/domain/recommendations/interfaces/recommendation.interface';

@Injectable()
export class GetPersonalizedRecommendationsUseCase {
  constructor(
    private readonly dataPort: IRecommendationDataPort,
    private readonly strategyProvider: IRecommendationStrategyProvider,
  ) {}

  async execute(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedRecommendationResponse> {
    const userProfile = await this.dataPort.buildUserProfile(userId);
    const availableBooks = await this.dataPort.getAvailableBooks(userId);
    const totalRecommendationsToGenerate = 15;

    const strategy = await this.strategyProvider.getStrategy(userId);
    const recommendationsResponse: RecommendationResponse =
      await strategy.generate(
        userId,
        userProfile,
        availableBooks,
        totalRecommendationsToGenerate,
      );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecommendations =
      recommendationsResponse.recommendations.slice(startIndex, endIndex);

    const totalItems = recommendationsResponse.recommendations.length;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      analysis: recommendationsResponse.analysis,
      recommendations: paginatedRecommendations,
      currentPage: page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}
