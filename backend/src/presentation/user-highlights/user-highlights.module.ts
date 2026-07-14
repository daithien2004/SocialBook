import { Module } from '@nestjs/common';
import { UserHighlightsRepositoryModule } from '@/infrastructure/database/repositories/user-highlights/user-highlights-repository.module';
import { CreateUserHighlightUseCase } from '@/application/user-highlights/commands/create-user-highlight.use-case';
import { UpdateUserHighlightUseCase } from '@/application/user-highlights/commands/update-user-highlight.use-case';
import { DeleteUserHighlightUseCase } from '@/application/user-highlights/commands/delete-user-highlight.use-case';
import { GetUserHighlightsUseCase } from '@/application/user-highlights/queries/get-user-highlights.use-case';
import { UserHighlightsController } from './user-highlights.controller';

@Module({
  imports: [UserHighlightsRepositoryModule],
  controllers: [UserHighlightsController],
  providers: [
    CreateUserHighlightUseCase,
    UpdateUserHighlightUseCase,
    DeleteUserHighlightUseCase,
    GetUserHighlightsUseCase,
  ],
  exports: [UserHighlightsRepositoryModule],
})
export class UserHighlightsModule {}
