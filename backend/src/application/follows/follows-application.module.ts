import { Module } from '@nestjs/common';
import { CreateFollowHandler } from './commands/create-follow/create-follow.handler';
import { DeleteFollowHandler } from './commands/delete-follow/delete-follow.handler';
import { GetFollowStatusHandler } from './queries/get-follow-status/get-follow-status.handler';
import { GetFollowsHandler } from './queries/get-follows/get-follows.handler';
import { GetFollowingHandler } from './queries/get-following-with-user-info/get-following.handler';
import { GetFollowersHandler } from './queries/get-followers-with-user-info/get-followers.handler';
import { FollowsRepositoryModule } from '@/infrastructure/database/repositories/follows/follows-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { QueueModule } from '@/infrastructure/queue/queue.module';

export const CommandHandlers = [
  CreateFollowHandler,
  DeleteFollowHandler
];

export const QueryHandlers = [
  GetFollowStatusHandler,
  GetFollowsHandler,
  GetFollowingHandler,
  GetFollowersHandler
];

@Module({
  imports: [FollowsRepositoryModule, IdGeneratorModule, QueueModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    CreateFollowHandler,
    DeleteFollowHandler,
    GetFollowStatusHandler,
    GetFollowsHandler,
    GetFollowingHandler,
    GetFollowersHandler,
  ],
})
export class FollowsApplicationModule {}
