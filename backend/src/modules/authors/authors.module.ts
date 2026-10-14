import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { MediaInfrastructureModule } from '@/modules/media/infrastructure/public-api';
import { AuthorsInfrastructureModule } from './infrastructure/authors-infrastructure.module';
import { CreateAuthorHandler } from './application/commands/create-author/create-author.handler';
import { UpdateAuthorHandler } from './application/commands/update-author/update-author.handler';
import { DeleteAuthorHandler } from './application/commands/delete-author/delete-author.handler';
import { GetAuthorHandler } from './application/queries/get-author/get-author.handler';
import { ListAuthorsHandler } from './application/queries/list-authors/list-authors.handler';
import { FindAuthorByNameHandler } from './application/queries/find-author-by-name/find-author-by-name.handler';
import { defineAuthorAbilities } from './application/policies/author.ability';
import { AuthorsController } from './presentation/authors.controller';

@Module({
  imports: [
    CqrsModule,
    AuthorsInfrastructureModule,
    IdGeneratorModule,
    MediaInfrastructureModule,
  ],
  controllers: [AuthorsController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineAuthorAbilities]),
    },
    PoliciesGuard,
    CreateAuthorHandler,
    UpdateAuthorHandler,
    DeleteAuthorHandler,
    GetAuthorHandler,
    ListAuthorsHandler,
    FindAuthorByNameHandler,
  ],
})
export class AuthorsModule {}
