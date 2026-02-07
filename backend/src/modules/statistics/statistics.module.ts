import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { StatisticsController } from './presentation/statistics.controller';

import { GetOverviewStatsUseCase } from './application/use-cases/get-overview-stats.use-case';
import { GetUserStatsUseCase } from './application/use-cases/get-user-stats.use-case';
import { GetBookStatsUseCase } from './application/use-cases/get-book-stats.use-case';
import { GetEngagementStatsUseCase } from './application/use-cases/get-engagement-stats.use-case';

import { LocationCheckService } from './infrastructure/services/location-check.service';
import { User, UserSchema } from '../users/infrastructure/schemas/user.schema';
import { Book, BookSchema } from '../books/infrastructure/schemas/book.schema';
import { Post, PostSchema } from '../posts/infrastructure/schemas/post.schema';
import { Comment, CommentSchema } from '../comments/infrastructure/schemas/comment.schema';
import { Review, ReviewSchema } from '../reviews/infrastructure/schemas/review.schema';
import { Progress, ProgressSchema } from '../progress/schemas/progress.schema'; // Progress might be different, check if infra exists
import { Chapter, ChapterSchema } from '../chapters/infrastructure/schemas/chapter.schema';

import { UsersModule } from '../users/users.module';
import { BooksModule } from '../books/books.module';
import { PostsModule } from '../posts/posts.module';
import { CommentsModule } from '../comments/comments.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { ProgressRepository } from '../progress/infrastructure/repositories/progress.repository';
import { IProgressRepository } from '../progress/domain/repositories/progress.repository.interface';


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Book.name, schema: BookSchema },
            { name: Post.name, schema: PostSchema },
            { name: Comment.name, schema: CommentSchema },
            { name: Review.name, schema: ReviewSchema },
            { name: Progress.name, schema: ProgressSchema },
            { name: Chapter.name, schema: ChapterSchema },
        ]),
        UsersModule,
        BooksModule,
        PostsModule,
        CommentsModule,
        ReviewsModule,
        ChaptersModule,
    ],
    controllers: [StatisticsController],
    providers: [
        GetOverviewStatsUseCase,
        GetUserStatsUseCase,
        GetBookStatsUseCase,
        GetEngagementStatsUseCase,
        LocationCheckService,
        { provide: IProgressRepository, useClass: ProgressRepository },
    ],
    exports: [
        GetOverviewStatsUseCase,
        GetUserStatsUseCase,
        GetBookStatsUseCase,
        GetEngagementStatsUseCase,
    ],
})
export class StatisticsModule { }
