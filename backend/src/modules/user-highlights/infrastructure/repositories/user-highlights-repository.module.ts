import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IUserHighlightRepository } from '../../domain/repositories/user-highlight.repository.interface';
import { UserHighlightRepository } from './user-highlight.repository';
import { UserHighlightReadRepository } from '../../application/ports/user-highlight-read.repository';
import { PrismaUserHighlightReadRepository } from './user-highlight-read.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IUserHighlightRepository,
      useClass: UserHighlightRepository,
    },
    {
      provide: UserHighlightReadRepository,
      useClass: PrismaUserHighlightReadRepository,
    },
  ],
  exports: [IUserHighlightRepository, UserHighlightReadRepository],
})
export class UserHighlightsRepositoryModule {}
