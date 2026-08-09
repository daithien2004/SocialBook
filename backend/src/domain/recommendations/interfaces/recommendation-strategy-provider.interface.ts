import { IRecommendationStrategy } from './recommendation-strategy.interface';

export abstract class IRecommendationStrategyProvider {
  abstract getStrategy(userId: string): Promise<IRecommendationStrategy>;
}
