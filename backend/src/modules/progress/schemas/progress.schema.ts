import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReadingStatus } from '../../library/infrastructure/schemas/reading-list.schema';

import { BaseSchema } from '../../../shared/schemas/base.schema';

export type ProgressDocument = HydratedDocument<Progress>;

@Schema({ timestamps: true, collection: 'progresses' })
export class Progress extends BaseSchema {
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

  @Prop({ default: 0 })
  xpEarned: number;

  @Prop({ default: 0 })
  pagesRead: number; // Session pages

  @Prop({ default: 0 })
  wordsRead: number;

  @Prop({ type: Date, default: Date.now })
  lastReadAt: Date;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);

ProgressSchema.index({ userId: 1, chapterId: 1 }, { unique: true });

ProgressSchema.index({ lastReadAt: 1 });
ProgressSchema.index({ userId: 1, lastReadAt: -1 });
ProgressSchema.index({ bookId: 1, lastReadAt: -1 });
