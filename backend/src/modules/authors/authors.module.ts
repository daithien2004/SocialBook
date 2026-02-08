import { Module } from '@nestjs/common';
import { CloudinaryModule } from '@/src/modules/cloudinary/cloudinary.module';
import { AuthorsInfrastructureModule } from './infrastructure/authors.infrastructure.module';
import { CloudinaryService } from '../cloudinary/infrastructure/services/cloudinary.service';

// Domain layer imports (for interfaces and entities)
import { IAuthorRepository } from './domain/repositories/author.repository.interface';

// Infrastructure layer imports
// The AuthorRepository import is removed from here as per instruction,
// as it's now likely provided by AuthorsInfrastructureModule.

// Application layer imports - Use Cases
import { CreateAuthorUseCase } from './application/use-cases/create-author/create-author.use-case';
import { UpdateAuthorUseCase } from './application/use-cases/update-author/update-author.use-case';
import { GetAuthorsUseCase } from './application/use-cases/get-authors/get-authors.use-case';
import { GetAuthorByIdUseCase } from './application/use-cases/get-author-by-id/get-author-by-id.use-case';
import { DeleteAuthorUseCase } from './application/use-cases/delete-author/delete-author.use-case';

// Presentation layer imports
import { AuthorsController } from './presentation/authors.controller';

@Module({
  imports: [
    AuthorsInfrastructureModule,
    CloudinaryModule,
  ],
  controllers: [AuthorsController],
  providers: [
    // Use cases
    CreateAuthorUseCase,
    UpdateAuthorUseCase,
    GetAuthorsUseCase,
    GetAuthorByIdUseCase,
    DeleteAuthorUseCase,
    // External services
    CloudinaryService,
  ],
  exports: [
    AuthorsInfrastructureModule,
    CreateAuthorUseCase,
    UpdateAuthorUseCase,
    GetAuthorsUseCase,
    GetAuthorByIdUseCase,
    DeleteAuthorUseCase,
  ],
})
export class AuthorsModule {}
