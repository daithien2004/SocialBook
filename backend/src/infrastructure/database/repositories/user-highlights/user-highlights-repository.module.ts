import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserHighlight,
  UserHighlightSchema,
} from '@/infrastructure/database/schemas/user-highlight.schema';
import { USER_HIGHLIGHT_REPOSITORY_TOKEN } from '@/domain/user-highlights/repositories/user-highlight.repository.interface';
import { UserHighlightRepository } from './user-highlight.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserHighlight.name, schema: UserHighlightSchema },
    ]),
  ],
  providers: [
    {
      provide: USER_HIGHLIGHT_REPOSITORY_TOKEN,
      useClass: UserHighlightRepository,
    },
  ],
  exports: [USER_HIGHLIGHT_REPOSITORY_TOKEN],
})
export class UserHighlightsRepositoryModule {}
