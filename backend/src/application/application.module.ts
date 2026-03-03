import { Module } from '@nestjs/common';
import { UsersApplicationModule } from './users/users-application.module';
import { BooksApplicationModule } from './books/books-application.module';
import { AuthorsApplicationModule } from './authors/authors-application.module';
import { ChaptersApplicationModule } from './chapters/chapters-application.module';
import { CommentsApplicationModule } from './comments/comments-application.module';
import { GenresApplicationModule } from './genres/genres-application.module';
import { PostsApplicationModule } from './posts/posts-application.module';
import { ReviewsApplicationModule } from './reviews/reviews-application.module';
import { NotificationsApplicationModule } from './notifications/notifications-application.module';
import { ContentModerationModule } from './content-moderation/content-moderation.module';
import { AuthApplicationModule } from './auth/auth-application.module';
import { RolesApplicationModule } from './roles/roles-application.module';
import { OtpApplicationModule } from './otp/otp-application.module';
import { FollowsApplicationModule } from './follows/follows-application.module';
import { LibraryApplicationModule } from './library/library-application.module';
import { LikesApplicationModule } from './likes/likes-application.module';
import { StatisticsApplicationModule } from './statistics/statistics-application.module';
import { ChromaApplicationModule } from './chroma/chroma-application.module';
import { GamificationApplicationModule } from './gamification/gamification-application.module';
import { ScraperApplicationModule } from './scraper/scraper-application.module';
import { SearchApplicationModule } from './search/search-application.module';
import { TextToSpeechApplicationModule } from './text-to-speech/text-to-speech-application.module';
import { OnboardingApplicationModule } from './onboarding/onboarding-application.module';
import { GeminiApplicationModule } from './gemini/gemini-application.module';
import { RecommendationsApplicationModule } from './recommendations/recommendations-application.module';

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
    NotificationsApplicationModule,
    ContentModerationModule,
    AuthApplicationModule,
    RolesApplicationModule,
    OtpApplicationModule,
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
  ],
  exports: [
    UsersApplicationModule,
    BooksApplicationModule,
    AuthorsApplicationModule,
    ChaptersApplicationModule,
    CommentsApplicationModule,
    GenresApplicationModule,
    PostsApplicationModule,
    ReviewsApplicationModule,
    NotificationsApplicationModule,
    ContentModerationModule,
    AuthApplicationModule,
    RolesApplicationModule,
    OtpApplicationModule,
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
  ],
})
export class ApplicationModule {}
