import { Module } from '@nestjs/common';
import { CreateAuthorHandler } from './use-cases/create-author/create-author.handler';
import { DeleteAuthorHandler } from './use-cases/delete-author/delete-author.handler';
import { GetAuthorByIdHandler } from './use-cases/get-author-by-id/get-author-by-id.handler';
import { GetAuthorsHandler } from './use-cases/get-authors/get-authors.handler';
import { UpdateAuthorHandler } from './use-cases/update-author/update-author.handler';
import { AuthorsRepositoryModule } from '@/infrastructure/database/repositories/authors/authors-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

export const CommandHandlers = [
  CreateAuthorHandler,
  DeleteAuthorHandler,
  UpdateAuthorHandler
];

export const QueryHandlers = [
  GetAuthorByIdHandler,
  GetAuthorsHandler
];

@Module({
  imports: [AuthorsRepositoryModule, IdGeneratorModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    CreateAuthorHandler,
    DeleteAuthorHandler,
    GetAuthorByIdHandler,
    GetAuthorsHandler,
    UpdateAuthorHandler,
  ],
})
export class AuthorsApplicationModule {}
