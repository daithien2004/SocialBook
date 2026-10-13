import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IFollowRepository } from '@/modules/follows/domain/repositories/follow.repository.interface';
import { FollowRepository } from './follow.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IFollowRepository,
      useClass: FollowRepository,
    },
  ],
  exports: [IFollowRepository],
})
export class FollowsRepositoryModule {}
