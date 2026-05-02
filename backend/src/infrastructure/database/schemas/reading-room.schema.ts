import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


export type ReadingRoomDocument = ReadingRoom & Document;

@Schema({ _id: false })
export class RoomMemberSchema {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, enum: ['host', 'member'], required: true })
  role: string;

  @Prop({ type: Date, required: true })
  joinedAt: Date;

  @Prop({ type: Date })
  leftAt?: Date;
}

@Schema({ _id: false })
export class RoomHighlight {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  chapterSlug: string;

  @Prop({ type: String, required: true })
  paragraphId: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String })
  aiInsight?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

const RoomHighlightSchema = SchemaFactory.createForClass(RoomHighlight);

@Schema({ _id: true, timestamps: true })
export class ChatMessage {
  _id?: Types.ObjectId;

  @Prop({ type: String, required: true })

  userId: string;

  @Prop({ type: String, required: true, enum: ['user', 'ai'] })
  role: 'user' | 'ai';

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

@Schema({ timestamps: true, collection: 'reading_rooms' })
export class ReadingRoom {

  @Prop({ type: String, required: true })
  _id: string; // roomId (6-char code)

  @Prop({ type: String, required: true })
  bookId: string;

  @Prop({ type: String, required: true })
  hostId: string;

  @Prop({ type: String, enum: ['sync', 'free', 'discussion'], required: true })
  mode: string;

  @Prop({ type: String, enum: ['active', 'ended'], required: true, default: 'active' })
  status: string;

  @Prop({ type: String, required: true })
  currentChapterSlug: string;

  @Prop({ type: Number, required: true, default: 10 })
  maxMembers: number;

  @Prop({ type: [SchemaFactory.createForClass(RoomMemberSchema)], default: [] })
  members: RoomMemberSchema[];

  @Prop({ type: [RoomHighlightSchema], default: [] })
  highlights: RoomHighlight[];

  @Prop({ type: [ChatMessageSchema], default: [] })
  chatMessages: ChatMessage[];

  @Prop({ type: Date })
  endedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}



export const ReadingRoomSchema = SchemaFactory.createForClass(ReadingRoom);

// Optimize performance with indexes following ESR rule (Equality, Sort, Range)
ReadingRoomSchema.index({ 'members.userId': 1, status: 1, updatedAt: -1 });
ReadingRoomSchema.index({ 'members.userId': 1, status: 1, endedAt: -1 });
ReadingRoomSchema.index({ bookId: 1, status: 1 });
ReadingRoomSchema.index({ status: 1 });
