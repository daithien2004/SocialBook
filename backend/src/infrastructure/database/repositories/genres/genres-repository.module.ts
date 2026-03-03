import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Genre, GenreSchema } from '@/infrastructure/database/schemas/genre.schema';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { GenresRepository } from './genres.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Genre.name, schema: GenreSchema }]),
  ],
  providers: [
    {
      provide: IGenreRepository,
      useClass: GenresRepository,
    },
  ],
  exports: [
    IGenreRepository,
    MongooseModule,
  ],
})
export class GenresRepositoryModule {}
