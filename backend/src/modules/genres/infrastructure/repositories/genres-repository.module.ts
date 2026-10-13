import { Module } from '@nestjs/common';
import { IGenreRepository } from '@/modules/genres/domain/repositories/genre.repository.interface';
import { GenresRepository } from './genres.repository';

@Module({
  providers: [
    {
      provide: IGenreRepository,
      useClass: GenresRepository,
    },
  ],
  exports: [IGenreRepository],
})
export class GenresRepositoryModule {}
