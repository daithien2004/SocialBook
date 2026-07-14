import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserHighlight,
  UserHighlightSchema,
} from '@/infrastructure/database/schemas/user-highlight.schema';
import { UserHighlightRepository } from './user-highlight.repository';

export const USER_HIGHLIGHT_REPOSITORY_TOKEN = 'IUserHighlightRepository';

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
