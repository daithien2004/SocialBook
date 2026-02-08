import { Module } from '@nestjs/common';
import { GetPersonalizedRecommendationsUseCase } from './use-cases/get-personalized-recommendations.use-case';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { LibraryRepositoryModule } from '@/infrastructure/database/repositories/library/library-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { ChromaRepositoryModule } from '@/infrastructure/database/repositories/chroma/chroma-repository.module';
import { LikesRepositoryModule } from '@/infrastructure/database/repositories/likes/likes-repository.module';
import { ReviewsRepositoryModule } from '@/infrastructure/database/repositories/reviews/reviews-repository.module';
import { OnboardingRepositoryModule } from '@/infrastructure/database/repositories/onboarding/onboarding-repository.module';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

@Module({
  imports: [
    BooksRepositoryModule,
    LibraryRepositoryModule,
    GenresRepositoryModule,
    ChromaRepositoryModule,
    LikesRepositoryModule,
    ReviewsRepositoryModule,
    OnboardingRepositoryModule,
    InfrastructureModule,
  ],
  providers: [GetPersonalizedRecommendationsUseCase],
  exports: [GetPersonalizedRecommendationsUseCase],
})
export class RecommendationsApplicationModule {}
