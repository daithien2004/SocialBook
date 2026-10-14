import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { IGenreRepository } from '@/modules/genres/domain/repositories/genre.repository.interface';
import { GenresRepository } from './genres.repository';
import { GenreReadRepository } from '../../application/ports/genre-read.repository';
import { PrismaGenreReadRepository } from './prisma-genre-read.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: IGenreRepository,
      useClass: GenresRepository,
    },
    {
      provide: GenreReadRepository,
      useClass: PrismaGenreReadRepository,
    },
  ],
  exports: [IGenreRepository, GenreReadRepository],
})
export class GenresRepositoryModule {}
