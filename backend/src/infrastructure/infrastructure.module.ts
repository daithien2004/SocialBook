import { Module } from '@nestjs/common';
import { AuthInfrastructureModule } from './auth/auth-infrastructure.module';
import { IdGeneratorModule } from './database/id/id-generator.module';
import { AuthorsRepositoryModule } from './database/repositories/authors/authors-repository.module';
import { BooksRepositoryModule } from './database/repositories/books/books-repository.module';
import { ChaptersRepositoryModule } from './database/repositories/chapters/chapters-repository.module';
import { CommentsRepositoryModule } from './database/repositories/comments/comments-repository.module';
import { FollowsRepositoryModule } from './database/repositories/follows/follows-repository.module';
import { GamificationRepositoryModule } from './database/repositories/gamification/gamification-repository.module';
import { GeminiRepositoryModule } from './database/repositories/gemini/gemini-repository.module';
import { GenresRepositoryModule } from './database/repositories/genres/genres-repository.module';
import { LibraryRepositoryModule } from './database/repositories/library/library-repository.module';
import { LikesRepositoryModule } from './database/repositories/likes/likes-repository.module';
import { NotificationsRepositoryModule } from './database/repositories/notifications/notifications-repository.module';
import { OnboardingRepositoryModule } from './database/repositories/onboarding/onboarding-repository.module';
import { OtpRepositoryModule } from './database/repositories/otp/otp-repository.module';
import { PostsRepositoryModule } from './database/repositories/posts/posts-repository.module';
import { ProgressRepositoryModule } from './database/repositories/progress/progress-repository.module';
import { ReviewsRepositoryModule } from './database/repositories/reviews/reviews-repository.module';
import { RolesRepositoryModule } from './database/repositories/roles/roles-repository.module';
import { TextToSpeechRepositoryModule } from './database/repositories/text-to-speech/text-to-speech-repository.module';
import { UsersRepositoryModule } from './database/repositories/users/users-repository.module';
import { ApplicationServicesModule } from './external/application-services.module';
import { ExternalServicesModule } from './external/external-services.module';
import { ProvidersModule } from './external/providers.module';
import { GatewaysModule } from './gateways/gateways.module';
import { RecommendationsInfrastructureModule } from './recommendations/recommendations-infrastructure.module';
import { ScraperInfrastructureModule } from './scraper/scraper-infrastructure.module';

@Module({
  imports: [
    AuthInfrastructureModule,
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
    ExternalServicesModule,
    ApplicationServicesModule,
    ScraperInfrastructureModule,
    ProvidersModule,
    RecommendationsInfrastructureModule,
    IdGeneratorModule,
    GatewaysModule,
  ],
  exports: [
    AuthInfrastructureModule,
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
    ExternalServicesModule,
    ApplicationServicesModule,
    ScraperInfrastructureModule,
    ProvidersModule,
    RecommendationsInfrastructureModule,
    IdGeneratorModule,
    GatewaysModule,
  ],
})
export class InfrastructureModule { }
