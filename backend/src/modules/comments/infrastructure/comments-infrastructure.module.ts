import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ICommentRepository } from '../domain/repositories/comment.repository.interface';
import { Comment } from './schemas/comment.schema';
import { CommentSchema } from './schemas/comment.schema';
import { CommentRepository } from './repositories/comment.repository';
import {
  Like,
  LikeSchema,
} from '@/modules/likes/infrastructure/schemas/public-api';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Like.name, schema: LikeSchema },
    ]),
  ],
  providers: [{ provide: ICommentRepository, useClass: CommentRepository }],
  exports: [ICommentRepository],
})
export class CommentsInfrastructureModule {}
