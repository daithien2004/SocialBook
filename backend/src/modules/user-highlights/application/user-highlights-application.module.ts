import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CreateUserHighlightHandler } from './commands/create-user-highlight/create-user-highlight.handler';
import { UpdateUserHighlightHandler } from './commands/update-user-highlight/update-user-highlight.handler';
import { DeleteUserHighlightHandler } from './commands/delete-user-highlight/delete-user-highlight.handler';
import { GetUserHighlightsHandler } from './queries/get-user-highlights/get-user-highlights.handler';
import { UserHighlightsInfrastructureModule } from '../infrastructure/user-highlights-infrastructure.module';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';

@Module({
  imports: [CqrsModule, UserHighlightsInfrastructureModule, IdGeneratorModule],
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
