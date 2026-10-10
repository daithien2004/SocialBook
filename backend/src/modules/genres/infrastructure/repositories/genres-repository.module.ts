import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Genre,
  GenreSchema,
} from '@/modules/genres/infrastructure/schemas/genre.schema';
import { IGenreRepository } from '@/modules/genres/domain/repositories/genre.repository.interface';
import { GenresRepository } from './genres.repository';
import { MongoPersistenceModule } from '@/shared/infrastructure/mongo-persistence.module';

@Module({
  imports: [
    MongoPersistenceModule,
    MongooseModule.forFeature([{ name: Genre.name, schema: GenreSchema }]),
  ],
  providers: [
    {
      provide: IGenreRepository,
      useClass: GenresRepository,
    },
  ],
  exports: [IGenreRepository],
})
export class GenresRepositoryModule {}
