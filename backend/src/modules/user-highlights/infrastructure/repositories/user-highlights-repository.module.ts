import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserHighlight,
  UserHighlightSchema,
} from '../schemas/user-highlight.schema';
import { IUserHighlightRepository } from '../../domain/repositories/user-highlight.repository.interface';
import { UserHighlightRepository } from './user-highlight.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserHighlight.name, schema: UserHighlightSchema },
    ]),
  ],
  providers: [
    {
      provide: IUserHighlightRepository,
      useClass: UserHighlightRepository,
    },
  ],
  exports: [IUserHighlightRepository],
})
export class UserHighlightsRepositoryModule {}
