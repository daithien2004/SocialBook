import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoomReactionDocument = RoomReactionSchema & Document;

@Schema({ collection: 'room_reactions', timestamps: true })
export class RoomReactionSchema {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true, index: true })
  roomId: string;

  @Prop({ type: String, required: true })
  chapterSlug: string;

  @Prop({ type: String, required: true })
  paragraphId: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  reactionType: string;

  createdAt: Date;
  updatedAt: Date;
}

export const RoomReactionSchemaFactory =
  SchemaFactory.createForClass(RoomReactionSchema);

RoomReactionSchemaFactory.index(
  { roomId: 1, chapterSlug: 1, paragraphId: 1, reactionType: 1, userId: 1 },
  { unique: true },
);
RoomReactionSchemaFactory.index({ roomId: 1, chapterSlug: 1, paragraphId: 1 });
RoomReactionSchemaFactory.index({ roomId: 1, createdAt: -1 });
// Index for findUserReaction query (without chapterSlug)
RoomReactionSchemaFactory.index({
  roomId: 1,
  paragraphId: 1,
  userId: 1,
  reactionType: 1,
});
