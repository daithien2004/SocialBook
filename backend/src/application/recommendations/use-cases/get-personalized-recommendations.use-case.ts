import { Injectable, Logger } from '@nestjs/common';
import { AIRecommendationStrategy } from '@/infrastructure/recommendations/strategies/ai-recommendation.strategy';
import { FallbackRecommendationStrategy } from '@/infrastructure/recommendations/strategies/fallback-recommendation.strategy';
import { IRecommendationDataPort } from '@/domain/recommendations/interfaces/recommendation-data.port';
import {
  RecommendationResponse,
  PaginatedRecommendationResponse,
} from '@/domain/recommendations/interfaces/recommendation.interface';

@Injectable()
export class GetPersonalizedRecommendationsUseCase {
  private readonly logger = new Logger(
    GetPersonalizedRecommendationsUseCase.name,
  );

  constructor(
    private readonly dataPort: IRecommendationDataPort,
    private aiStrategy: AIRecommendationStrategy,
    private fallbackStrategy: FallbackRecommendationStrategy,
  ) {}

  async execute(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedRecommendationResponse> {
    const userProfile = await this.dataPort.buildUserProfile(userId);
    const availableBooks = await this.dataPort.getAvailableBooks(userId);

    const interactionCount = await this.dataPort.getInteractionCount(userId);
    const MIN_ACTIVITY_FOR_AI = 3;
    const totalRecommendationsToGenerate = 15;

    let recommendationsResponse: RecommendationResponse;

    if (interactionCount < MIN_ACTIVITY_FOR_AI) {
      this.logger.log(
        `Low activity for user ${userId} (${interactionCount}). Skipping AI.`,
      );
      recommendationsResponse = await this.fallbackStrategy.generate(
        userId,
        userProfile,
        availableBooks,
        totalRecommendationsToGenerate,
      );
    } else {
      this.logger.log(
        `Sufficient activity for user ${userId} (${interactionCount}). Using AI.`,
      );
      recommendationsResponse = await this.aiStrategy.generate(
        userId,
        userProfile,
        availableBooks,
        totalRecommendationsToGenerate,
      );
    }

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
