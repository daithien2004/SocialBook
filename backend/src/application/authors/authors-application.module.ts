import { Module } from '@nestjs/common';
import { CreateAuthorUseCase } from './use-cases/create-author/create-author.use-case';
import { DeleteAuthorUseCase } from './use-cases/delete-author/delete-author.use-case';
import { GetAuthorByIdUseCase } from './use-cases/get-author-by-id/get-author-by-id.use-case';
import { GetAuthorsUseCase } from './use-cases/get-authors/get-authors.use-case';
import { UpdateAuthorUseCase } from './use-cases/update-author/update-author.use-case';
import { AuthorsRepositoryModule } from '@/infrastructure/database/repositories/authors/authors-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [
    AuthorsRepositoryModule,
    IdGeneratorModule,
  ],
  providers: [
    CreateAuthorUseCase,
    DeleteAuthorUseCase,
    GetAuthorByIdUseCase,
    GetAuthorsUseCase,
    UpdateAuthorUseCase,
  ],
  exports: [
    CreateAuthorUseCase,
    DeleteAuthorUseCase,
    GetAuthorByIdUseCase,
    GetAuthorsUseCase,
    UpdateAuthorUseCase,
  ],
})
export class AuthorsApplicationModule {}
