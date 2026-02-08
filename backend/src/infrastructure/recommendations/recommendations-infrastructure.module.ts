import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '@/infrastructure/database/schemas/book.schema';
import { Genre, GenreSchema } from '@/infrastructure/database/schemas/genre.schema';
import { AIRecommendationStrategy } from './strategies/ai-recommendation.strategy';
import { FallbackRecommendationStrategy } from './strategies/fallback-recommendation.strategy';
import { GeminiRepositoryModule } from '../database/repositories/gemini/gemini-repository.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Genre.name, schema: GenreSchema },
    ]),
    GeminiRepositoryModule,
  ],
  providers: [
    AIRecommendationStrategy,
    FallbackRecommendationStrategy,
  ],
  exports: [
    AIRecommendationStrategy,
    FallbackRecommendationStrategy,
  ],
})
export class RecommendationsInfrastructureModule {}
