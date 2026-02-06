import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Author, AuthorSchema } from '../modules/authors/schemas/author.schema';
import { Book, BookSchema } from '../modules/books/schemas/book.schema';
import { Chapter, ChapterSchema } from '../modules/chapters/schemas/chapter.schema';
import { Comment, CommentSchema } from '../modules/comments/schemas/comment.schema';
import { Follow, FollowSchema } from '../modules/follows/schemas/follow.schema';
import { Genre, GenreSchema } from '../modules/genres/schemas/genre.schema';
import { Like, LikeSchema } from '../modules/likes/schemas/like.schema';
import { Post, PostSchema } from '../modules/posts/schemas/post.schema';
import { Review, ReviewSchema } from '../modules/reviews/schemas/review.schema';
import { User, UserSchema } from '../modules/users/schemas/user.schema';

import { IGenreRepository } from '../domain/repositories/genre.repository.interface';
import { AuthorsRepository } from './repositories/authors.repository';
import { BooksRepository } from './repositories/books.repository';
import { ChaptersRepository } from './repositories/chapters.repository';
import { CommentsRepository } from './repositories/comments.repository';
import { FollowsRepository } from './repositories/follows.repository';
import { GenresRepository } from './repositories/genres.repository';
import { LikesRepository } from './repositories/likes.repository';
import { PostsRepository } from './repositories/posts.repository';
import { ReviewsRepository } from './repositories/reviews.repository';
import { UsersRepository } from './repositories/users.repository';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Author.name, schema: AuthorSchema },
            { name: Book.name, schema: BookSchema },
            { name: Chapter.name, schema: ChapterSchema },
            { name: Comment.name, schema: CommentSchema },
            { name: Follow.name, schema: FollowSchema },
            { name: Genre.name, schema: GenreSchema },
            { name: Like.name, schema: LikeSchema },
            { name: Post.name, schema: PostSchema },
            { name: Review.name, schema: ReviewSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    providers: [
        AuthorsRepository,
        BooksRepository,
        ChaptersRepository,
        CommentsRepository,
        FollowsRepository,
        {
            provide: IGenreRepository,
            useClass: GenresRepository,
        },
        LikesRepository,
        PostsRepository,
        ReviewsRepository,
        UsersRepository,
    ],
    exports: [
        MongooseModule,
        AuthorsRepository,
        BooksRepository,
        ChaptersRepository,
        CommentsRepository,
        FollowsRepository,
        IGenreRepository,
        LikesRepository,
        PostsRepository,
        ReviewsRepository,
        UsersRepository,
    ],
})
export class DataAccessModule { }

