import { Module } from '@nestjs/common';
import { GetLikeCountHandler } from './queries/get-like-count/get-like-count.handler';
import { GetLikeStatusHandler } from './queries/get-like-status/get-like-status.handler';
import { ToggleLikeHandler } from './commands/toggle-like/toggle-like.handler';
import { LikesInfrastructureModule } from '../infrastructure/likes-infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { QueueModule } from '@/infrastructure/queue/queue.module';

export const CommandHandlers = [ToggleLikeHandler];

export const QueryHandlers = [GetLikeCountHandler, GetLikeStatusHandler];

@Module({
  imports: [LikesInfrastructureModule, IdGeneratorModule, QueueModule],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [GetLikeCountHandler, GetLikeStatusHandler, ToggleLikeHandler],
})
export class LikesApplicationModule {}
