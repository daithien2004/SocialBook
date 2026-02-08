// src/modules/library/schemas/reading-list.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReadingListDocument = HydratedDocument<ReadingList>;

export enum ReadingStatus {
  READING = 'READING',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

import { BaseSchema } from '@/shared/schemas/base.schema';

@Schema({ timestamps: true, collection: 'reading_lists' })
export class ReadingList extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  bookId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ReadingStatus,
    default: ReadingStatus.READING,
  })
  status: ReadingStatus;

  @Prop({ type: Types.ObjectId, ref: 'Chapter', default: null })
  lastReadChapterId: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Collection' }],
    default: [],
  })
  collectionIds: Types.ObjectId[];
}

export const ReadingListSchema = SchemaFactory.createForClass(ReadingList);

ReadingListSchema.index({ userId: 1, bookId: 1 }, { unique: true });

ReadingListSchema.index({ userId: 1, status: 1, updatedAt: -1 });
