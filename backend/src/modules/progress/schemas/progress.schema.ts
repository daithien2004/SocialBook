// src/modules/progress/schemas/progress.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReadingStatus } from '../../library/schemas/reading-list.schema';

export type ProgressDocument = HydratedDocument<Progress>;

@Schema({ timestamps: true, collection: 'progresses' })
export class Progress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true, index: true })
  bookId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chapter', required: true })
  chapterId: Types.ObjectId;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: 0 })
  timeSpent: number;

  @Prop({ type: String, enum: ReadingStatus, default: ReadingStatus.READING })
  status: string;

  @Prop({ type: Date, default: Date.now })
  lastReadAt: Date;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);

ProgressSchema.index({ userId: 1, chapterId: 1 }, { unique: true });

ProgressSchema.index({ lastReadAt: 1 });
ProgressSchema.index({ userId: 1, lastReadAt: -1 });
ProgressSchema.index({ bookId: 1, lastReadAt: -1 });
