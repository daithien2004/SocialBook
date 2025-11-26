import { Module} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Post, PostSchema } from '@/src/modules/posts/schemas/post.schema';
import { ReadingList, ReadingListSchema } from '@/src/modules/library/schemas/reading-list.schema';
import { Follow, FollowSchema } from '@/src/modules/follows/schemas/follow.schema';
import { CloudinaryModule } from '@/src/modules/cloudinary/cloudinary.module';

@Module({
  imports: [
    CloudinaryModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: ReadingList.name, schema: ReadingListSchema },
      { name: Follow.name, schema: FollowSchema },
    ]),

  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
