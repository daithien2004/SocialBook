import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/repositories/books/books-repository.module';
import { TouchBookForReadingRoomHandler } from '../books/commands/touch-book-for-reading-room/touch-book-for-reading-room.handler';

@Module({
  imports: [BooksRepositoryModule, CqrsModule],
  providers: [TouchBookForReadingRoomHandler],
})
export class BooksReadingRoomsIntegrationModule {}
