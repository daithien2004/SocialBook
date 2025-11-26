import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { ProgressMigrationService } from '../library/progress-migration.service';
import { LocationCheckService } from './location-check.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import { Progress, ProgressSchema } from '../progress/schemas/progress.schema';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema';

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
    ],
    controllers: [StatisticsController],
    providers: [StatisticsService, ProgressMigrationService, LocationCheckService],
    exports: [StatisticsService],
})
export class StatisticsModule { }
