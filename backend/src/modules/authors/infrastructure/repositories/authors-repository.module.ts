import { Module } from '@nestjs/common';
import { AuthorRepository } from '../../domain/repositories/author.repository';
import { PrismaAuthorRepository } from './author.repository';
import { AuthorReadRepository } from '../../application/ports/author-read.repository';
import { AuthorIndexReadRepository } from '../../application/ports/author-index-read.repository';
import { PrismaAuthorReadRepository } from './prisma-author-read.repository';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: AuthorRepository,
      useClass: PrismaAuthorRepository,
    },
    {
      provide: AuthorReadRepository,
      useClass: PrismaAuthorReadRepository,
    },
    {
      provide: AuthorIndexReadRepository,
      useExisting: PrismaAuthorReadRepository,
    },
  ],
  exports: [AuthorRepository, AuthorReadRepository, AuthorIndexReadRepository],
})
export class AuthorsRepositoryModule {}
