import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LikesModule } from '../likes/likes.module';
import { Follow, FollowSchema } from './schemas/follow.schema';
import { User, UserSchema } from '@/src/modules/users/schemas/user.schema';
import { FollowsService } from '@/src/modules/follows/follows.service';
import { FollowsController } from '@/src/modules/follows/follows.controller';
import { UsersModule } from '@/src/modules/users/users.module';


@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Follow.name, schema: FollowSchema },
      { name: User.name, schema: UserSchema },
    ]),
    LikesModule,
  ],
  controllers: [FollowsController],
  providers: [FollowsService],
})
export class FollowsModule {}
