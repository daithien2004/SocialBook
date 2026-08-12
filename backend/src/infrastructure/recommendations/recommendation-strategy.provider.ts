import { Injectable, Logger } from '@nestjs/common';
import { IRecommendationStrategy } from '@/domain/recommendations/interfaces/recommendation-strategy.interface';
import { IRecommendationStrategyProvider } from '@/domain/recommendations/interfaces/recommendation-strategy-provider.interface';
import { IRecommendationDataPort } from '@/domain/recommendations/interfaces/recommendation-data.interface';
import { AIRecommendationStrategy } from './strategies/ai-recommendation.strategy';
import { FallbackRecommendationStrategy } from './strategies/fallback-recommendation.strategy';

@Injectable()
export class RecommendationStrategyProvider
  implements IRecommendationStrategyProvider
{
  private readonly logger = new Logger(RecommendationStrategyProvider.name);
  private readonly MIN_ACTIVITY_FOR_AI = 3;

  constructor(
    private readonly dataPort: IRecommendationDataPort,
    private readonly aiStrategy: AIRecommendationStrategy,
    private readonly fallbackStrategy: FallbackRecommendationStrategy,
  ) {}

  async getStrategy(userId: string): Promise<IRecommendationStrategy> {
    const interactionCount = await this.dataPort.getInteractionCount(userId);

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
