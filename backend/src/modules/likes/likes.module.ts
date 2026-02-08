import { Module } from '@nestjs/common';
import { LikesInfrastructureModule } from './infrastructure/likes.infrastructure.module';

// Presentation layer imports
import { LikesController } from './presentation/likes.controller';

// Application layer imports - Use Cases
import { ToggleLikeUseCase } from './application/use-cases/toggle-like/toggle-like.use-case';
import { GetLikeCountUseCase } from './application/use-cases/get-like-count/get-like-count.use-case';
import { GetLikeStatusUseCase } from './application/use-cases/get-like-status/get-like-status.use-case';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    LikesInfrastructureModule,
    CloudinaryModule,
  ],
  controllers: [LikesController],
  providers: [
    // Use cases
    ToggleLikeUseCase,
    GetLikeCountUseCase,
    GetLikeStatusUseCase,
  ],
  exports: [
    LikesInfrastructureModule,
    ToggleLikeUseCase,
    GetLikeCountUseCase,
    GetLikeStatusUseCase,
  ],
})
export class LikesModule {}
