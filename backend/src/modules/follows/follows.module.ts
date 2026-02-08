import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/src/modules/notifications/notifications.module';
import { LikesModule } from '../likes/likes.module';
import { FollowsInfrastructureModule } from './infrastructure/follows.infrastructure.module';
import { UsersInfrastructureModule } from '../users/infrastructure/users.infrastructure.module';

// Domain layer imports (for interfaces and entities)
import { IFollowRepository } from './domain/repositories/follow.repository.interface';

// Application layer imports - Use Cases
import { CreateFollowUseCase } from './application/use-cases/create-follow/create-follow.use-case';
import { GetFollowsUseCase } from './application/use-cases/get-follows/get-follows.use-case';
import { GetFollowStatusUseCase } from './application/use-cases/get-follow-status/get-follow-status.use-case';
import { DeleteFollowUseCase } from './application/use-cases/delete-follow/delete-follow.use-case';

// Presentation layer imports
import { FollowsController } from './presentation/follows.controller';

@Module({
  imports: [
    FollowsInfrastructureModule,
    UsersInfrastructureModule,
    NotificationsModule,
    LikesModule,
  ],
  controllers: [FollowsController],
  providers: [
    // Use cases
    CreateFollowUseCase,
    GetFollowsUseCase,
    GetFollowStatusUseCase,
    DeleteFollowUseCase,
  ],
  exports: [
    FollowsInfrastructureModule,
    CreateFollowUseCase,
    GetFollowsUseCase,
    GetFollowStatusUseCase,
    DeleteFollowUseCase,
  ],
})
export class FollowsModule {}
