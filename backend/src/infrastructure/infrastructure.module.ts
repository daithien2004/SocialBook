import { Module } from '@nestjs/common';
import { UsersRepositoryModule } from './database/repositories/users/users-repository.module';
import { BooksRepositoryModule } from './database/repositories/books/books-repository.module';
import { AuthorsRepositoryModule } from './database/repositories/authors/authors-repository.module';
import { ChaptersRepositoryModule } from './database/repositories/chapters/chapters-repository.module';
import { CommentsRepositoryModule } from './database/repositories/comments/comments-repository.module';
import { GenresRepositoryModule } from './database/repositories/genres/genres-repository.module';
import { PostsRepositoryModule } from './database/repositories/posts/posts-repository.module';
import { ReviewsRepositoryModule } from './database/repositories/reviews/reviews-repository.module';
import { NotificationsRepositoryModule } from './database/repositories/notifications/notifications-repository.module';
import { FollowsRepositoryModule } from './database/repositories/follows/follows-repository.module';
import { LikesRepositoryModule } from './database/repositories/likes/likes-repository.module';
import { LibraryRepositoryModule } from './database/repositories/library/library-repository.module';
import { RolesRepositoryModule } from './database/repositories/roles/roles-repository.module';
import { GamificationRepositoryModule } from './database/repositories/gamification/gamification-repository.module';
import { OnboardingRepositoryModule } from './database/repositories/onboarding/onboarding-repository.module';
import { OtpRepositoryModule } from './database/repositories/otp/otp-repository.module';
import { ProgressRepositoryModule } from './database/repositories/progress/progress-repository.module';
import { GeminiRepositoryModule } from './database/repositories/gemini/gemini-repository.module';
import { TextToSpeechRepositoryModule } from './database/repositories/text-to-speech/text-to-speech-repository.module';
import { DatabaseServicesModule } from './database/services/database-services.module';
import { ScraperInfrastructureModule } from './scraper/scraper-infrastructure.module';
import { ProvidersModule } from './providers/providers.module';
import { RecommendationsInfrastructureModule } from './recommendations/recommendations-infrastructure.module';

@Module({
  imports: [
    UsersRepositoryModule,
    BooksRepositoryModule,
    AuthorsRepositoryModule,
    ChaptersRepositoryModule,
    CommentsRepositoryModule,
    GenresRepositoryModule,
    PostsRepositoryModule,
    ReviewsRepositoryModule,
    NotificationsRepositoryModule,
    FollowsRepositoryModule,
    LikesRepositoryModule,
    LibraryRepositoryModule,
    RolesRepositoryModule,
    GamificationRepositoryModule,
    OnboardingRepositoryModule,
    OtpRepositoryModule,
    ProgressRepositoryModule,
    GeminiRepositoryModule,
    TextToSpeechRepositoryModule,
    DatabaseServicesModule,
    ScraperInfrastructureModule,
    ProvidersModule,
    RecommendationsInfrastructureModule,
  ],
  exports: [
    UsersRepositoryModule,
    BooksRepositoryModule,
    AuthorsRepositoryModule,
    ChaptersRepositoryModule,
    CommentsRepositoryModule,
    GenresRepositoryModule,
    PostsRepositoryModule,
    ReviewsRepositoryModule,
    NotificationsRepositoryModule,
    FollowsRepositoryModule,
    LikesRepositoryModule,
    LibraryRepositoryModule,
    RolesRepositoryModule,
    GamificationRepositoryModule,
    OnboardingRepositoryModule,
    OtpRepositoryModule,
    ProgressRepositoryModule,
    GeminiRepositoryModule,
    TextToSpeechRepositoryModule,
    DatabaseServicesModule,
    ScraperInfrastructureModule,
    ProvidersModule,
    RecommendationsInfrastructureModule,
  ],
})
export class InfrastructureModule {}
