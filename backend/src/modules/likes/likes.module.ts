import { forwardRef, Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Like, LikeSchema } from '@/src/modules/likes/schemas/like.schema';
import { NotificationsModule } from '@/src/modules/notifications/notifications.module';
import { PostsModule } from '@/src/modules/posts/posts.module';
import { CommentsModule } from '@/src/modules/comments/comments.module';
import { UsersModule } from '@/src/modules/users/users.module';

@Module({
  imports: [
    NotificationsModule,
    PostsModule,
    forwardRef(() => CommentsModule),
    UsersModule,
    MongooseModule.forFeature([
      { name: Like.name, schema: LikeSchema },
    ])],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule { }
