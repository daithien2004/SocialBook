import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '@/src/modules/notifications/notifications.module';
import { UsersModule } from '@/src/modules/users/users.module';
import { LikesModule } from '../likes/likes.module';
import { Follow, FollowSchema } from './infrastructure/schemas/follow.schema';

// Domain layer imports (for interfaces and entities)
import { IFollowRepository } from './domain/repositories/follow.repository.interface';

// Infrastructure layer imports
import { FollowRepository } from './infrastructure/repositories/follow.repository';

// Application layer imports - Use Cases
import { CreateFollowUseCase } from './application/use-cases/create-follow/create-follow.use-case';
import { GetFollowsUseCase } from './application/use-cases/get-follows/get-follows.use-case';
import { GetFollowStatusUseCase } from './application/use-cases/get-follow-status/get-follow-status.use-case';
import { DeleteFollowUseCase } from './application/use-cases/delete-follow/delete-follow.use-case';

// Presentation layer imports
import { FollowsController } from './presentation/follows.controller';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([
      { name: Follow.name, schema: FollowSchema },
    ]),
    NotificationsModule,
    LikesModule,
  ],
  controllers: [FollowsController],
  providers: [
    // Repository implementation
    {
      provide: IFollowRepository,
      useClass: FollowRepository,
    },
    // Use cases
    CreateFollowUseCase,
    GetFollowsUseCase,
    GetFollowStatusUseCase,
    DeleteFollowUseCase,
  ],
  exports: [
    IFollowRepository,
    CreateFollowUseCase,
    GetFollowsUseCase,
    GetFollowStatusUseCase,
    DeleteFollowUseCase,
  ],
})
export class FollowsModule {}
