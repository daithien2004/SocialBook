import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { ILikeRepository } from '@/modules/likes/domain/repositories/like.repository.interface';
import { LikeRepository } from './like.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: ILikeRepository,
      useClass: LikeRepository,
    },
  ],
  exports: [ILikeRepository],
})
export class LikesRepositoryModule {}
