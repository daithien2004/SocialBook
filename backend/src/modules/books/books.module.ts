import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorsModule } from '../authors/authors.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SearchModule } from '../search/search.module';
import { BooksInfrastructureModule } from './infrastructure/books.infrastructure.module';

// Domain layer imports (for interfaces and entities)
import { IBookRepository } from './domain/repositories/book.repository.interface';

// Infrastructure layer imports

// Application layer imports - Use Cases
import { CreateBookUseCase } from './application/use-cases/create-book/create-book.use-case';
import { UpdateBookUseCase } from './application/use-cases/update-book/update-book.use-case';
import { GetBooksUseCase } from './application/use-cases/get-books/get-books.use-case';
import { GetBookByIdUseCase } from './application/use-cases/get-book-by-id/get-book-by-id.use-case';
import { GetBookBySlugUseCase } from './application/use-cases/get-book-by-slug/get-book-by-slug.use-case';
import { DeleteBookUseCase } from './application/use-cases/delete-book/delete-book.use-case';

// Presentation layer imports
import { BooksController } from './presentation/books.controller';

import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [
    BooksInfrastructureModule,
    CloudinaryModule,
    forwardRef(() => SearchModule),
    AuthorsModule,
    ReviewsModule,
  ],
  controllers: [BooksController],
  providers: [
    // Use cases
    CreateBookUseCase,
    UpdateBookUseCase,
    GetBooksUseCase,
    GetBookByIdUseCase,
    GetBookBySlugUseCase,
    DeleteBookUseCase,
    // External services
  ],
  exports: [
    BooksInfrastructureModule,
    CreateBookUseCase,
    UpdateBookUseCase,
    GetBooksUseCase,
    GetBookByIdUseCase,
    GetBookBySlugUseCase,
    DeleteBookUseCase,
  ],
})
export class BooksModule {}
