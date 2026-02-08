import { Module } from '@nestjs/common';
import { LocationCheckService } from './location-check.service';
import { UsersRepositoryModule } from '../database/repositories/users/users-repository.module';
import { ChaptersRepositoryModule } from '../database/repositories/chapters/chapters-repository.module';
import { ProgressRepositoryModule } from '../database/repositories/progress/progress-repository.module';

@Module({
  imports: [
    UsersRepositoryModule,
    ChaptersRepositoryModule,
    ProgressRepositoryModule,
  ],
  providers: [LocationCheckService],
  exports: [LocationCheckService],
})
export class ApplicationServicesModule {}
