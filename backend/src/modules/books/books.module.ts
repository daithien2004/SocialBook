import { Module } from '@nestjs/common';
import { BooksApplicationModule } from './application/books/books-application.module';
import { BooksController } from './presentation/books/books.controller';
import { BooksReadingRoomsIntegrationModule } from './application/public-api/books-reading-rooms-integration.module';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineBookAbilities } from './application/policies/book.ability';

@Module({
  imports: [BooksApplicationModule, BooksReadingRoomsIntegrationModule],
  controllers: [BooksController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineBookAbilities]),
    },
    PoliciesGuard,
  ],
})
export class BooksModule {}
