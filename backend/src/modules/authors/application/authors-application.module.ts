import { Module } from '@nestjs/common';
import { CreateAuthorHandler } from './commands/create-author/create-author.handler';
import { DeleteAuthorHandler } from './commands/delete-author/delete-author.handler';
import { GetAuthorByIdHandler } from './queries/get-author-by-id/get-author-by-id.handler';
import { GetAuthorsHandler } from './queries/get-authors/get-authors.handler';
import { UpdateAuthorHandler } from './commands/update-author/update-author.handler';
import { AuthorsInfrastructureModule } from '../infrastructure/authors-infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

export const CommandHandlers = [
  CreateAuthorHandler,
  DeleteAuthorHandler,
  UpdateAuthorHandler,
];

export const QueryHandlers = [GetAuthorByIdHandler, GetAuthorsHandler];

@Module({
  imports: [AuthorsInfrastructureModule, IdGeneratorModule],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [
    CreateAuthorHandler,
    DeleteAuthorHandler,
    GetAuthorByIdHandler,
    GetAuthorsHandler,
    UpdateAuthorHandler,
  ],
})
export class AuthorsApplicationModule {}
