import { QueryHandler } from '@nestjs/cqrs';
import { GetPersonalizedRecommendationsQuery } from './get-personalized-recommendations.query';
import { Logger } from '@nestjs/common';
import { IRecommendationFactory } from '@/modules/recommendations/domain/interfaces/recommendation-factory.interface';
import { IRecommendationDataRepository } from '@/modules/recommendations/domain/interfaces/recommendation-data.repository.interface';
import {
  RecommendationResult,
  PaginatedRecommendationResult,
} from '@/modules/recommendations/domain/interfaces/recommendation-result';
import { buildPaginationMeta } from '@/shared/domain/pagination.types';

@QueryHandler(GetPersonalizedRecommendationsQuery)
export class GetPersonalizedRecommendationsHandler {
  private readonly logger = new Logger(
    GetPersonalizedRecommendationsHandler.name,
  );

  constructor(
    private readonly recommendationFactory: IRecommendationFactory,
    private readonly dataRepository: IRecommendationDataRepository,
  ) {}

  async execute(
    query: GetPersonalizedRecommendationsQuery,
  ): Promise<PaginatedRecommendationResult> {
    const { userId, page, limit } = query;
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

    return {
      analysis: recommendationsResponse.analysis,
      recommendations: paginatedRecommendations,
      meta: buildPaginationMeta(
        page,
        limit,
        recommendationsResponse.recommendations.length,
      ),
    };
  }
}
