import { Injectable, Logger } from '@nestjs/common';
import { IRecommendationStrategy } from '@/domain/recommendations/interfaces/recommendation-strategy.interface';
import { IRecommendationFactory } from '@/domain/recommendations/interfaces/recommendation-factory.interface';
import { IRecommendationDataRepository } from '@/domain/recommendations/interfaces/recommendation-data.repository.interface';
import { AIRecommendationStrategy } from './strategies/ai-recommendation.strategy';
import { FallbackRecommendationStrategy } from './strategies/fallback-recommendation.strategy';

@Injectable()
export class RecommendationFactory extends IRecommendationFactory {
  private readonly logger = new Logger(RecommendationFactory.name);
  private readonly MIN_ACTIVITY_FOR_AI = 3;

  constructor(
    private readonly dataRepository: IRecommendationDataRepository,
    private readonly aiStrategy: AIRecommendationStrategy,
    private readonly fallbackStrategy: FallbackRecommendationStrategy,
  ) {
    super();
  }

  async getStrategy(userId: string): Promise<IRecommendationStrategy> {
    const interactionCount =
      await this.dataRepository.getInteractionCount(userId);

    if (interactionCount < this.MIN_ACTIVITY_FOR_AI) {
      this.logger.log(
        `Low activity for user ${userId} (${interactionCount}). Skipping AI.`,
      );
      return this.fallbackStrategy;
    }

    this.logger.log(
      `Sufficient activity for user ${userId} (${interactionCount}). Using AI.`,
    );
    return this.aiStrategy;
  }
}
