import { Module } from '@nestjs/common';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { CommentsRepositoryModule } from '@/infrastructure/database/repositories/comments/comments-repository.module';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { BookTargetHandler } from './handlers/book-target.handler';
import { ChapterTargetHandler } from './handlers/chapter-target.handler';
import { CommentTargetHandler } from './handlers/comment-target.handler';
import { ParagraphTargetHandler } from './handlers/paragraph-target.handler';
import { PostTargetHandler } from './handlers/post-target.handler';
import { ITargetTypeHandler } from './interfaces/target-type-handler.interface';
import { TargetResolverRegistry } from './target-resolution.registry';

@Module({
  imports: [
    BooksRepositoryModule,
    ChaptersRepositoryModule,
    CommentsRepositoryModule,
    PostsRepositoryModule,
  ],
  providers: [
    BookTargetHandler,
    PostTargetHandler,
    ChapterTargetHandler,
    ParagraphTargetHandler,
    CommentTargetHandler,
    {
      provide: ITargetTypeHandler,
      useFactory: (
        book: BookTargetHandler,
        post: PostTargetHandler,
        chapter: ChapterTargetHandler,
        paragraph: ParagraphTargetHandler,
        comment: CommentTargetHandler,
      ): ITargetTypeHandler[] => [book, post, chapter, paragraph, comment],
      inject: [
        BookTargetHandler,
        PostTargetHandler,
        ChapterTargetHandler,
        ParagraphTargetHandler,
        CommentTargetHandler,
      ],
    },
    TargetResolverRegistry,
  ],
  exports: [TargetResolverRegistry],
})
export class TargetResolutionModule {}
