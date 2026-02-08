
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './schemas/book.schema';
import { BookRepository } from './repositories/book.repository';
import { IBookRepository } from '../domain/repositories/book.repository.interface';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
    ],
    providers: [
        {
            provide: IBookRepository,
            useClass: BookRepository,
        },
    ],
    exports: [
        IBookRepository,
    ],
})
export class BooksInfrastructureModule {}
