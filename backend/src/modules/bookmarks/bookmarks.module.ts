import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { BookmarksRepositoryModule } from './infrastructure/repositories/bookmarks-repository.module';
import { CreateBookmarkHandler } from './application/commands/create-bookmark/create-bookmark.handler';
import { DeleteBookmarkHandler } from './application/commands/delete-bookmark/delete-bookmark.handler';
import { GetBookmarksByBookHandler } from './application/queries/get-bookmarks-by-book/get-bookmarks-by-book.handler';
import { defineBookmarkAbilities } from './application/policies/bookmark.ability';
import { BookmarkController } from './presentation/http/bookmark.controller';

@Module({
  imports: [CqrsModule, BookmarksRepositoryModule, IdGeneratorModule],
  controllers: [BookmarkController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineBookmarkAbilities]),
    },
    PoliciesGuard,
    CreateBookmarkHandler,
    DeleteBookmarkHandler,
    GetBookmarksByBookHandler,
  ],
})
export class BookmarksModule {}
