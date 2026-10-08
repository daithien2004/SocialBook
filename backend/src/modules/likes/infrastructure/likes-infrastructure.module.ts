import { Module } from '@nestjs/common';
import { LikesRepositoryModule } from './repositories/likes-repository.module';

@Module({
  imports: [LikesRepositoryModule],
  exports: [LikesRepositoryModule],
})
export class LikesInfrastructureModule {}
