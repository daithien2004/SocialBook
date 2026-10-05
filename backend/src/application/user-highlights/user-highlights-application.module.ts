import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CreateUserHighlightHandler } from './use-cases/create-user-highlight/create-user-highlight.handler';
import { UpdateUserHighlightHandler } from './use-cases/update-user-highlight/update-user-highlight.handler';
import { DeleteUserHighlightHandler } from './use-cases/delete-user-highlight/delete-user-highlight.handler';
import { GetUserHighlightsHandler } from './use-cases/get-user-highlights/get-user-highlights.handler';
import { UserHighlightsRepositoryModule } from '@/infrastructure/database/repositories/user-highlights/user-highlights-repository.module';

@Module({
  imports: [
    CqrsModule,UserHighlightsRepositoryModule],
  providers: [
    CreateUserHighlightHandler,
    UpdateUserHighlightHandler,
    DeleteUserHighlightHandler,
    GetUserHighlightsHandler,
  ],
  exports: [
    CreateUserHighlightHandler,
    UpdateUserHighlightHandler,
    DeleteUserHighlightHandler,
    GetUserHighlightsHandler,
  ],
})
export class UserHighlightsApplicationModule {}
