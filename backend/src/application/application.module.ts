import { Module } from '@nestjs/common';
import { UsersApplicationModule } from '@/modules/users/application/users/users-application.module';
import { BooksApplicationModule } from '@/modules/books/application/books/books-application.module';
import { ChaptersApplicationModule } from '@/modules/chapters/application/chapters/chapters-application.module';
import { PostsApplicationModule } from '@/modules/posts/application/posts/posts-application.module';
import { ChromaApplicationModule } from '@/modules/chroma/application/chroma-application.module';
import { NotificationsApplicationModule } from '@/modules/notifications';
import { AuthApplicationModule } from '@/modules/auth/application/auth/auth-application.module';
import { OtpApplicationModule } from '@/modules/auth/application/otp/otp-application.module';
import { LibraryApplicationModule } from '@/modules/library/application/library/library-application.module';
import { PostModerationApplicationModule } from '@/modules/posts/application/posts/post-moderation.application.module';

@Module({
  imports: [
    UsersApplicationModule,
    BooksApplicationModule,
    ChaptersApplicationModule,
    PostsApplicationModule,
    ChromaApplicationModule,
    NotificationsApplicationModule,
    AuthApplicationModule,
    OtpApplicationModule,
    LibraryApplicationModule,
    PostModerationApplicationModule,
  ],
  exports: [
    UsersApplicationModule,
    BooksApplicationModule,
    ChaptersApplicationModule,
    PostsApplicationModule,
    ChromaApplicationModule,
    NotificationsApplicationModule,
    AuthApplicationModule,
    OtpApplicationModule,
    LibraryApplicationModule,
    PostModerationApplicationModule,
  ],
})
export class ApplicationModule {}
