import { Module } from '@nestjs/common';
import { FollowsApplicationModule } from './application/follows-application.module';
import { FollowsController } from './presentation/follows.controller';

@Module({
  imports: [FollowsApplicationModule],
  controllers: [FollowsController],
})
export class FollowsModule {}
