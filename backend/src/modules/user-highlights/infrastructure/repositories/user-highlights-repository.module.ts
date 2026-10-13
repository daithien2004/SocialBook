import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IUserHighlightRepository } from '../../domain/repositories/user-highlight.repository.interface';
import { UserHighlightRepository } from './user-highlight.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IUserHighlightRepository,
      useClass: UserHighlightRepository,
    },
  ],
  exports: [IUserHighlightRepository],
})
export class UserHighlightsRepositoryModule {}
