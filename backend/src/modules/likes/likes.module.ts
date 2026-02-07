import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Presentation layer imports
import { LikesController } from './presentation/likes.controller';

// Application layer imports - Use Cases
import { ToggleLikeUseCase } from './application/use-cases/toggle-like/toggle-like.use-case';
import { GetLikeCountUseCase } from './application/use-cases/get-like-count/get-like-count.use-case';
import { GetLikeStatusUseCase } from './application/use-cases/get-like-status/get-like-status.use-case';

// Infrastructure layer imports
import { LikeRepository } from './infrastructure/repositories/like.repository';

// Schemas
import { LikeSchema } from './infrastructure/schemas/like.schema';

import { ILikeRepository } from './domain/repositories/like.repository.interface';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Like', schema: LikeSchema }
    ])
  ],
  controllers: [LikesController],
  providers: [
    // Repository implementations
    {
      provide: ILikeRepository,
      useClass: LikeRepository,
    },
    LikeRepository,
    // Use cases
    ToggleLikeUseCase,
    GetLikeCountUseCase,
    GetLikeStatusUseCase,
  ],
  exports: [
    ILikeRepository,
    LikeRepository,
    ToggleLikeUseCase,
    GetLikeCountUseCase,
    GetLikeStatusUseCase,
  ],
})
export class LikesModule {}
