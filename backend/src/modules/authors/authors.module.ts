import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CloudinaryService } from '../cloudinary/infrastructure/services/cloudinary.service';
import { Author, AuthorSchema } from './infrastructure/schemas/author.schema';

// Domain layer imports (for interfaces and entities)
import { IAuthorRepository } from './domain/repositories/author.repository.interface';

// Infrastructure layer imports
import { AuthorRepository } from './infrastructure/repositories/author.repository';

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
    MongooseModule.forFeature([{ name: Author.name, schema: AuthorSchema }]),
    CloudinaryModule,
  ],
  controllers: [AuthorsController],
  providers: [
    // Repository implementation
    {
      provide: IAuthorRepository,
      useClass: AuthorRepository,
    },
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
    IAuthorRepository,
    CreateAuthorUseCase,
    UpdateAuthorUseCase,
    GetAuthorsUseCase,
    GetAuthorByIdUseCase,
    DeleteAuthorUseCase,
  ],
})
export class AuthorsModule {}
