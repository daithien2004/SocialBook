import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LikesModule } from '../likes/likes.module';
import { Follow, FollowSchema } from './schemas/folllow.schema';
import { User, UserSchema } from '@/src/modules/users/schemas/user.schema';
import { FollowsService } from '@/src/modules/folllows/folllows.service';
import { FollowsController } from '@/src/modules/folllows/folllows.controller';


@Module({
  imports: [
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
