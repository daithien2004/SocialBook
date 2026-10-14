import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { GenresRepositoryModule } from './infrastructure/repositories/genres-repository.module';
import { CreateGenreHandler } from './application/commands/create-genre/create-genre.handler';
import { UpdateGenreHandler } from './application/commands/update-genre/update-genre.handler';
import { DeleteGenreHandler } from './application/commands/delete-genre/delete-genre.handler';
import { GetGenresHandler } from './application/queries/get-genres/get-genres.handler';
import { GetGenreByIdHandler } from './application/queries/get-genre-by-id/get-genre-by-id.handler';
import { FindGenreByNameHandler } from './application/queries/find-genre-by-name/find-genre-by-name.handler';
import { defineGenreAbilities } from './application/policies/genre.ability';
import { GenresController } from './presentation/genres.controller';

@Module({
  imports: [CqrsModule, GenresRepositoryModule, IdGeneratorModule],
  controllers: [GenresController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineGenreAbilities]),
    },
    PoliciesGuard,
    CreateGenreHandler,
    UpdateGenreHandler,
    DeleteGenreHandler,
    GetGenresHandler,
    GetGenreByIdHandler,
    FindGenreByNameHandler,
  ],
})
export class GenresModule {}
