import { Module } from '@nestjs/common';
import { GetLikeCountUseCase } from './use-cases/get-like-count/get-like-count.use-case';
import { GetLikeStatusUseCase } from './use-cases/get-like-status/get-like-status.use-case';
import { ToggleLikeUseCase } from './use-cases/toggle-like/toggle-like.use-case';
import { LikesRepositoryModule } from '@/infrastructure/database/repositories/likes/likes-repository.module';

@Module({
  imports: [LikesRepositoryModule],
  providers: [
    GetLikeCountUseCase,
    GetLikeStatusUseCase,
    ToggleLikeUseCase,
  ],
  exports: [
    GetLikeCountUseCase,
    GetLikeStatusUseCase,
    ToggleLikeUseCase,
  ],
})
export class LikesApplicationModule {}
