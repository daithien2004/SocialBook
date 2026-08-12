import { Module } from '@nestjs/common';
import { CreateUserHighlightUseCase } from './use-cases/create-user-highlight/create-user-highlight.use-case';
import { UpdateUserHighlightUseCase } from './use-cases/update-user-highlight/update-user-highlight.use-case';
import { DeleteUserHighlightUseCase } from './use-cases/delete-user-highlight/delete-user-highlight.use-case';
import { GetUserHighlightsUseCase } from './use-cases/get-user-highlights/get-user-highlights.use-case';
import { UserHighlightsRepositoryModule } from '@/infrastructure/database/repositories/user-highlights/user-highlights-repository.module';

@Module({
  imports: [UserHighlightsRepositoryModule],
  providers: [
    CreateUserHighlightUseCase,
    UpdateUserHighlightUseCase,
    DeleteUserHighlightUseCase,
    GetUserHighlightsUseCase,
  ],
  exports: [
    CreateUserHighlightUseCase,
    UpdateUserHighlightUseCase,
    DeleteUserHighlightUseCase,
    GetUserHighlightsUseCase,
  ],
})
export class UserHighlightsApplicationModule {}
