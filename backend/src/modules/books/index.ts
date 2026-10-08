export { BooksModule } from './books.module';
export { BooksApplicationModule } from './application/books/books-application.module';
export { BooksRepositoryModule } from './infrastructure/repositories/books/books-repository.module';
export { Book } from './domain/books/entities/book.entity';
export { IBookRepository } from './domain/books/repositories/book.repository.interface';
export {
  Book as BookSchemaModel,
  BookSchema,
} from './infrastructure/schemas/book.schema';
export type { BookDocument } from './infrastructure/schemas/book.schema';
