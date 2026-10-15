import { Module } from '@nestjs/common';
import { CreateFollowHandler } from './commands/create-follow/create-follow.handler';
import { DeleteFollowHandler } from './commands/delete-follow/delete-follow.handler';
import { GetFollowStatusHandler } from './queries/get-follow-status/get-follow-status.handler';
import { GetFollowsHandler } from './queries/get-follows/get-follows.handler';
import { GetFollowingHandler } from './queries/get-following-with-user-info/get-following.handler';
import { GetFollowersHandler } from './queries/get-followers-with-user-info/get-followers.handler';
import { FollowsInfrastructureModule } from '../infrastructure/follows-infrastructure.module';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { NotificationsInfrastructureModule } from '@/modules/notifications/infrastructure/public-api';

@Module({
  imports: [
    FollowsInfrastructureModule,
    IdGeneratorModule,
    NotificationsInfrastructureModule,
  ],
  providers: [
    CreateFollowHandler,
    DeleteFollowHandler,
    GetFollowStatusHandler,
    GetFollowsHandler,
    GetFollowingHandler,
    GetFollowersHandler,
  ],
})
export class FollowsApplicationModule {}
