import { Module } from '@nestjs/common';
import { CreateFollowUseCase } from './use-cases/create-follow/create-follow.use-case';
import { DeleteFollowUseCase } from './use-cases/delete-follow/delete-follow.use-case';
import { GetFollowStatusUseCase } from './use-cases/get-follow-status/get-follow-status.use-case';
import { GetFollowsUseCase } from './use-cases/get-follows/get-follows.use-case';
import { FollowsRepositoryModule } from '@/infrastructure/database/repositories/follows/follows-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [
    FollowsRepositoryModule,
    IdGeneratorModule,
  ],
  providers: [
    CreateFollowUseCase,
    DeleteFollowUseCase,
    GetFollowStatusUseCase,
    GetFollowsUseCase,
  ],
  exports: [
    CreateFollowUseCase,
    DeleteFollowUseCase,
    GetFollowStatusUseCase,
    GetFollowsUseCase,
  ],
})
export class FollowsApplicationModule {}
