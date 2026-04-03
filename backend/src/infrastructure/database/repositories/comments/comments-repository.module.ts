import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Comment,
  CommentSchema,
} from '@/infrastructure/database/schemas/comment.schema';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { CommentRepository } from './comment.repository';
import {
  Like,
  LikeSchema,
} from '@/infrastructure/database/schemas/like.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Like.name, schema: LikeSchema },
    ]),
  ],
  providers: [
    {
      provide: ICommentRepository,
      useClass: CommentRepository,
    },
  ],
  exports: [ICommentRepository, MongooseModule],
})
export class CommentsRepositoryModule {}
