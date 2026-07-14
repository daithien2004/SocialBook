import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RoomCommentSchema,
  RoomCommentSchemaFactory,
} from './room-comment.schema';
import {
  RoomReactionSchema,
  RoomReactionSchemaFactory,
} from './room-reaction.schema';
import { RoomQuoteSchema, RoomQuoteSchemaFactory } from './room-quote.schema';

const models = [
  { name: RoomCommentSchema.name, schema: RoomCommentSchemaFactory },
  { name: RoomReactionSchema.name, schema: RoomReactionSchemaFactory },
  { name: RoomQuoteSchema.name, schema: RoomQuoteSchemaFactory },
];

@Module({
  imports: [MongooseModule.forFeature(models)],
  exports: [MongooseModule.forFeature(models)],
})
export class ReadingRoomInteractionsSchemasModule {}
