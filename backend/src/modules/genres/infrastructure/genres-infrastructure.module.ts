import { Module } from '@nestjs/common';
import { GenresRepositoryModule } from './repositories/genres-repository.module';

@Module({
  imports: [GenresRepositoryModule],
  exports: [GenresRepositoryModule],
})
export class GenresInfrastructureModule {}
