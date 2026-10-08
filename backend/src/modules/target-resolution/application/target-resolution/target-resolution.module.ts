import { Module } from '@nestjs/common';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/public-api';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/public-api';
import { CommentsInfrastructureModule } from '@/modules/comments/infrastructure/public-api';
import { PostsRepositoryModule } from '@/modules/posts/infrastructure/public-api';
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
    CommentsInfrastructureModule,
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
