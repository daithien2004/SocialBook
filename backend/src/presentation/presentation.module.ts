import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthorsController } from './authors/authors.controller';
import { BooksController } from './books/books.controller';
import { ChaptersController } from './chapters/chapters.controller';
import { ChromaController } from './chroma/chroma.controller';
import { CommentsController } from './comments/comments.controller';
import { CollectionsController } from './collections/collections.controller';
import { FollowsController } from './follows/follows.controller';
import { GamificationController } from './gamification/gamification.controller';
import { GeminiController } from './gemini/gemini.controller';
import { GenresController } from './genres/genres.controller';
import { LibraryController } from './library/library.controller';
import { LikesController } from './likes/likes.controller';
import { NotificationController } from './notification/notification.controller';
import { OnboardingController } from './onboarding/onboarding.controller';
import { PostsController } from './posts/posts.controller';
import { RecommendationsController } from './recommendations/recommendations.controller';
import { ReviewsController } from './reviews/reviews.controller';
import { ScraperController } from './scraper/scraper.controller';
import { SearchController } from './search/search.controller';
import { StatisticsController } from './statistics/statistics.controller';
import { TextToSpeechController } from './text-to-speech/text-to-speech.controller';
import { UsersController } from './users/users.controller';

import { UsersApplicationModule } from '@/application/users/users-application.module';
import { BooksApplicationModule } from '@/application/books/books-application.module';
import { AuthorsApplicationModule } from '@/application/authors/authors-application.module';
import { ChaptersApplicationModule } from '@/application/chapters/chapters-application.module';
import { CommentsApplicationModule } from '@/application/comments/comments-application.module';
import { GenresApplicationModule } from '@/application/genres/genres-application.module';
import { PostsApplicationModule } from '@/application/posts/posts-application.module';
import { ReviewsApplicationModule } from '@/application/reviews/reviews-application.module';
import { AuthApplicationModule } from '@/application/auth/auth-application.module';
import { FollowsApplicationModule } from '@/application/follows/follows-application.module';
import { LibraryApplicationModule } from '@/application/library/library-application.module';
import { LikesApplicationModule } from '@/application/likes/likes-application.module';
import { StatisticsApplicationModule } from '@/application/statistics/statistics-application.module';
import { ChromaApplicationModule } from '@/application/chroma/chroma-application.module';
import { GamificationApplicationModule } from '@/application/gamification/gamification-application.module';
import { ScraperApplicationModule } from '@/application/scraper/scraper-application.module';
import { SearchApplicationModule } from '@/application/search/search-application.module';
import { TextToSpeechApplicationModule } from '@/application/text-to-speech/text-to-speech-application.module';
import { OnboardingApplicationModule } from '@/application/onboarding/onboarding-application.module';
import { GeminiApplicationModule } from '@/application/gemini/gemini-application.module';
import { RecommendationsApplicationModule } from '@/application/recommendations/recommendations-application.module';
import { NotificationsApplicationModule } from '@/application/notifications/notifications-application.module';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

@Module({
  imports: [
    UsersApplicationModule,
    BooksApplicationModule,
    AuthorsApplicationModule,
    ChaptersApplicationModule,
    CommentsApplicationModule,
    GenresApplicationModule,
    PostsApplicationModule,
    ReviewsApplicationModule,
    AuthApplicationModule,
    FollowsApplicationModule,
    LibraryApplicationModule,
    LikesApplicationModule,
    StatisticsApplicationModule,
    ChromaApplicationModule,
    GamificationApplicationModule,
    ScraperApplicationModule,
    SearchApplicationModule,
    TextToSpeechApplicationModule,
    OnboardingApplicationModule,
    GeminiApplicationModule,
    RecommendationsApplicationModule,
    NotificationsApplicationModule,
    InfrastructureModule,
  ],
  controllers: [
    AuthController,
    AuthorsController,
    BooksController,
    ChaptersController,
    ChromaController,
    CommentsController,
    CollectionsController,
    FollowsController,
    GamificationController,
    GeminiController,
    GenresController,
    LibraryController,
    LikesController,
    NotificationController,
    OnboardingController,
    PostsController,
    RecommendationsController,
    ReviewsController,
    ScraperController,
    SearchController,
    StatisticsController,
    TextToSpeechController,
    UsersController,
  ],
})
export class PresentationModule { }
