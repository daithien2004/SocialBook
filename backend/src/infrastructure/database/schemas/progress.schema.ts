import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ChapterStatus } from '@/domain/library/entities/reading-progress.entity';

import { BaseSchema } from '@/shared/schemas/base.schema';

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

  @Prop({
    type: String,
    enum: ChapterStatus,
    default: ChapterStatus.READING,
  })
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

ProgressSchema.index({ userId: 1, bookId: 1 });
ProgressSchema.index({ lastReadAt: 1 });
ProgressSchema.index({ userId: 1, lastReadAt: -1 });
ProgressSchema.index({ bookId: 1, lastReadAt: -1 });
