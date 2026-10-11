import { Module } from '@nestjs/common';
import { GetLikeCountHandler } from './queries/get-like-count/get-like-count.handler';
import { GetLikeStatusHandler } from './queries/get-like-status/get-like-status.handler';
import { ToggleLikeHandler } from './commands/toggle-like/toggle-like.handler';
import { LikesInfrastructureModule } from '../infrastructure/likes-infrastructure.module';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { NotificationsInfrastructureModule } from '@/modules/notifications/infrastructure/public-api';

export const CommandHandlers = [ToggleLikeHandler];

export const QueryHandlers = [GetLikeCountHandler, GetLikeStatusHandler];

@Module({
  imports: [
    LikesInfrastructureModule,
    IdGeneratorModule,
    NotificationsInfrastructureModule,
  ],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [GetLikeCountHandler, GetLikeStatusHandler, ToggleLikeHandler],
})
export class LikesApplicationModule {}
