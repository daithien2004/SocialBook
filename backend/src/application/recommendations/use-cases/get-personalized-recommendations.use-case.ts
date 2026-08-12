import { Injectable, Logger } from '@nestjs/common';
import { IRecommendationFactory } from '@/domain/recommendations/interfaces/recommendation-factory.interface';
import { IRecommendationDataRepository } from '@/domain/recommendations/interfaces/recommendation-data.repository.interface';
import {
  RecommendationResult,
  PaginatedRecommendationResult,
} from '../dto/recommendation-result.dto';

export interface GetPersonalizedRecommendationsQuery {
  userId: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class GetPersonalizedRecommendationsUseCase {
  private readonly logger = new Logger(
    GetPersonalizedRecommendationsUseCase.name,
  );

  constructor(
    private readonly recommendationFactory: IRecommendationFactory,
    private readonly dataRepository: IRecommendationDataRepository,
  ) {}

  async execute(
    query: GetPersonalizedRecommendationsQuery,
  ): Promise<PaginatedRecommendationResult> {
    const { userId, page = 1, limit = 10 } = query;
    this.logger.log(
      `Getting recommendations for user ${userId} (page ${page}, limit ${limit})`,
    );

    const userProfile = await this.dataRepository.buildUserProfile(userId);
    const availableBooks = await this.dataRepository.getAvailableBooks(userId);

    const strategy = await this.recommendationFactory.getStrategy(userId);
    const recommendationsResponse: RecommendationResult =
      await strategy.generate(userId, userProfile, availableBooks, 100);

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
