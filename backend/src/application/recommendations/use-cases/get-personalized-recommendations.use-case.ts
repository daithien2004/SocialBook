import { Injectable } from '@nestjs/common';
import { IRecommendationFactory } from '@/domain/recommendations/interfaces/recommendation-factory.interface';
import { IRecommendationDataRepository } from '@/domain/recommendations/interfaces/recommendation-data.repository.interface';
import {
  RecommendationResponse,
  PaginatedRecommendationResponse,
} from '@/domain/recommendations/interfaces/recommendation.interface';

@Injectable()
export class GetPersonalizedRecommendationsUseCase {
  constructor(
    private readonly dataRepository: IRecommendationDataRepository,
    private readonly strategyFactory: IRecommendationFactory,
  ) {}

  async execute(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedRecommendationResponse> {
    const userProfile = await this.dataRepository.buildUserProfile(userId);
    const availableBooks = await this.dataRepository.getAvailableBooks(userId);
    const totalRecommendationsToGenerate = 15;

    const strategy = await this.strategyFactory.getStrategy(userId);
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
