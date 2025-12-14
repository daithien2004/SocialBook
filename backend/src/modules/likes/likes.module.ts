import { forwardRef, Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Like, LikeSchema } from '@/src/modules/likes/schemas/like.schema';
import { NotificationsModule } from '@/src/modules/notifications/notifications.module';
import { PostsModule } from '@/src/modules/posts/posts.module';
import { CommentsModule } from '@/src/modules/comments/comments.module';
import { User, UserSchema } from '@/src/modules/users/schemas/user.schema';

@Module({
  imports:[
    NotificationsModule,
    PostsModule,
    forwardRef(() => CommentsModule),
    MongooseModule.forFeature([
      { name: Like.name, schema: LikeSchema },
      { name: User.name, schema: UserSchema }
    ])],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
