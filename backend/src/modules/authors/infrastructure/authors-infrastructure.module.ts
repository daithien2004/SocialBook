import { Module } from '@nestjs/common';
import { AuthorsRepositoryModule } from './repositories/authors-repository.module';

@Module({
  imports: [AuthorsRepositoryModule],
  exports: [AuthorsRepositoryModule],
})
export class AuthorsInfrastructureModule {}
