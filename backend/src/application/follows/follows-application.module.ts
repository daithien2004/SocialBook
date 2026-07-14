import { Module } from '@nestjs/common';
import { CreateFollowUseCase } from './use-cases/create-follow/create-follow.use-case';
import { DeleteFollowUseCase } from './use-cases/delete-follow/delete-follow.use-case';
import { GetFollowStatusUseCase } from './use-cases/get-follow-status/get-follow-status.use-case';
import { GetFollowsUseCase } from './use-cases/get-follows/get-follows.use-case';
import { GetFollowingUseCase } from './use-cases/get-following-with-user-info/get-following.use-case';
import { GetFollowersUseCase } from './use-cases/get-followers-with-user-info/get-followers.use-case';
import { FollowsRepositoryModule } from '@/infrastructure/database/repositories/follows/follows-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [FollowsRepositoryModule, IdGeneratorModule],
  providers: [
    CreateFollowUseCase,
    DeleteFollowUseCase,
    GetFollowStatusUseCase,
    GetFollowsUseCase,
    GetFollowingUseCase,
    GetFollowersUseCase,
  ],
  exports: [
    CreateFollowUseCase,
    DeleteFollowUseCase,
    GetFollowStatusUseCase,
    GetFollowsUseCase,
    GetFollowingUseCase,
    GetFollowersUseCase,
  ],
})
export class FollowsApplicationModule {}
