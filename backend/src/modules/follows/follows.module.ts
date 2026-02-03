import { FollowsController } from '@/src/modules/follows/follows.controller';
import { FollowsService } from '@/src/modules/follows/follows.service';
import { NotificationsModule } from '@/src/modules/notifications/notifications.module';
import { UsersModule } from '@/src/modules/users/users.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LikesModule } from '../likes/likes.module';
import { FollowsRepository } from '@/src/data-access/repositories/follows.repository';
import { Follow, FollowSchema } from './schemas/follow.schema';


@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Follow.name, schema: FollowSchema },
    ]),
    NotificationsModule,
    LikesModule,
  ],
  controllers: [FollowsController],
  providers: [FollowsService, FollowsRepository],
  exports: [FollowsService, FollowsRepository],
})
export class FollowsModule { }
