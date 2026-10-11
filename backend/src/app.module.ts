import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { AIModule } from './modules/ai';
import { AnalyticsModule } from './modules/analytics';
import { AuthModule } from './modules/auth';
import { AuthorsModule } from './modules/authors';
import { BookmarksModule } from './modules/bookmarks';
import { BooksModule } from './modules/books';
import { ChaptersModule } from './modules/chapters';
import { ChromaModule } from './modules/chroma';
import { CommentsModule } from './modules/comments';
import { ContentModerationModule } from './modules/content-moderation';
import { FollowsModule } from './modules/follows';
import { GenresModule } from './modules/genres';
import { LibraryModule } from './modules/library';
import { LikesModule } from './modules/likes';
import { NotificationsModule } from './modules/notifications';
import { PostsModule } from './modules/posts';
import { RecommendationsModule } from './modules/recommendations';
import { ReadingRoomsModule } from './modules/reading-rooms';
import { ReviewsModule } from './modules/reviews';
import { SearchModule } from './modules/search';
import { StatisticsModule } from './modules/statistics';
import { TextToSpeechModule } from './modules/text-to-speech';
import { UserHighlightsModule } from './modules/user-highlights';
import { UsersModule } from './modules/users';

@Module({
  imports: [
    CoreModule,
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
  ],
})
export class AppModule {}
