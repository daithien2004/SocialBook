import { Module } from '@nestjs/common';
import { FollowsRepositoryModule } from './repositories/follows-repository.module';

@Module({
  imports: [FollowsRepositoryModule],
  exports: [FollowsRepositoryModule],
})
export class FollowsInfrastructureModule {}
