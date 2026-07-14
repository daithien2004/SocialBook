import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoomQuoteDocument = RoomQuoteSchema & Document;

@Schema({ _id: false })
class QuoteVoteSchema {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, enum: ['up', 'down'], required: true })
  type: string;
}

const QuoteVoteSchemaFactory = SchemaFactory.createForClass(QuoteVoteSchema);

@Schema({ collection: 'room_quotes', timestamps: true })
export class RoomQuoteSchema {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true, index: true })
  roomId: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  chapterSlug: string;

  @Prop({ type: String, required: true })
  paragraphId: string;

  @Prop({ type: [QuoteVoteSchemaFactory], default: [] })
  votes: { userId: string; type: string }[];

  createdAt: Date;
  updatedAt: Date;
}

export const RoomQuoteSchemaFactory =
  SchemaFactory.createForClass(RoomQuoteSchema);

RoomQuoteSchemaFactory.index({ roomId: 1, createdAt: -1 });
