import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from '@/src/modules/comments/schemas/comment.schema';
import { LikesModule } from '@/src/modules/likes/likes.module';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    LikesModule,
    ContentModerationModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule { }
