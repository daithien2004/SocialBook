import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Author, AuthorSchema } from '../modules/authors/infrastructure/schemas/author.schema';
import { Book, BookSchema } from '../modules/books/infrastructure/schemas/book.schema';
import { Chapter, ChapterSchema } from '../modules/chapters/infrastructure/schemas/chapter.schema';
import { Comment, CommentSchema } from '../modules/comments/infrastructure/schemas/comment.schema';
import { Follow, FollowSchema } from '../modules/follows/infrastructure/schemas/follow.schema';
import { Genre, GenreSchema } from '../modules/genres/infrastructure/schemas/genre.schema';
import { Like, LikeSchema } from '../modules/likes/infrastructure/schemas/like.schema';
import { Post, PostSchema } from '../modules/posts/infrastructure/schemas/post.schema';
// Reviews moved to ReviewsModule
import { User, UserSchema } from '../modules/users/infrastructure/schemas/user.schema';

import { IGenreRepository } from '../modules/genres/domain/repositories/genre.repository.interface';
import { AuthorsRepository } from './repositories/authors.repository';
import { BooksRepository } from './repositories/books.repository';
import { ChaptersRepository } from './repositories/chapters.repository';
import { CommentsRepository } from './repositories/comments.repository';
import { FollowsRepository } from './repositories/follows.repository';
import { GenresRepository } from '../modules/genres/infrastructure/repositories/genres.repository';
import { LikesRepository } from './repositories/likes.repository';

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
    ],
    exports: [
        AuthorsRepository,
        BooksRepository,
        ChaptersRepository,
        CommentsRepository,
        FollowsRepository,
        IGenreRepository,
        LikesRepository,
    ],
})
export class DataAccessModule { }
