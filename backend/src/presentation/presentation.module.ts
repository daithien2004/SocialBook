import { Module } from '@nestjs/common';
import { AdminRateLimitController } from './admin/rate-limit.controller';

import { GatewaysModule } from './gateways/gateways.module';

import { UsersModule } from '@/modules/users';
import { BooksModule } from '@/modules/books';
import { ChaptersModule } from '@/modules/chapters';
import { PostsModule } from '@/modules/posts';
import { AuthModule } from '@/modules/auth';
import { LibraryModule } from '@/modules/library';
import { ChromaModule } from '@/modules/chroma';
import { TextToSpeechModule } from '@/modules/text-to-speech';
import { NotificationsModule } from '@/modules/notifications';
import { ContentModerationModule } from '@/modules/content-moderation';
import { ReadingRoomsModule } from '@/modules/reading-rooms';
import { BookmarksModule } from '@/modules/bookmarks';
import { UserHighlightsModule } from '@/modules/user-highlights';
import { AuthorsModule } from '@/modules/authors';
import { FollowsModule } from '@/modules/follows';
import { LikesModule } from '@/modules/likes';
import { GenresModule } from '@/modules/genres';
import { ReviewsModule } from '@/modules/reviews';
import { CommentsModule } from '@/modules/comments';
import { SearchModule } from '@/modules/search';
import { StatisticsModule } from '@/modules/statistics';
import { RecommendationsModule } from '@/modules/recommendations';
import { AIModule } from '@/modules/ai';

import { AnalyticsModule } from '@/modules/analytics';

import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    UsersModule,
    BooksModule,
    AuthorsModule,
    ChaptersModule,
    GenresModule,
    PostsModule,
    ReviewsModule,
    CommentsModule,
    AuthModule,
    FollowsModule,
    LibraryModule,
    LikesModule,
    StatisticsModule,
    ChromaModule,
    SearchModule,
    TextToSpeechModule,
    AIModule,
    RecommendationsModule,
    NotificationsModule,
    ContentModerationModule,
    BookmarksModule,
    UserHighlightsModule,
    ReadingRoomsModule,

    AnalyticsModule,
    GatewaysModule,
    InfrastructureModule,
    HealthModule,
  ],
  controllers: [AdminRateLimitController],
})
export class PresentationModule {}
