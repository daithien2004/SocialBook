import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoomCommentDocument = RoomCommentSchema & Document;

@Schema({ collection: 'room_comments', timestamps: true })
export class RoomCommentSchema {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true, index: true })
  roomId: string;

  @Prop({ type: String, required: true })
  chapterSlug: string;

  @Prop({ type: String, required: true })
  paragraphId: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String })
  parentCommentId?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const RoomCommentSchemaFactory =
  SchemaFactory.createForClass(RoomCommentSchema);

RoomCommentSchemaFactory.index({
  roomId: 1,
  chapterSlug: 1,
  paragraphId: 1,
  createdAt: 1,
});
RoomCommentSchemaFactory.index({ roomId: 1, createdAt: -1 });
