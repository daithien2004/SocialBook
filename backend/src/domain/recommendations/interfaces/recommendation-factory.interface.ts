import { IRecommendationStrategy } from './recommendation-strategy.interface';

export abstract class IRecommendationFactory {
  abstract getStrategy(userId: string): Promise<IRecommendationStrategy>;
}
