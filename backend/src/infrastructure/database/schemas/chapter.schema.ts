import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChapterDocument = Chapter & Document;

export interface ParagraphDocument {
  _id: Types.ObjectId;
  content: string;
}

@Schema({ _id: true })
class Paragraph {
  @Prop({ required: true })
  content: string;
}

const ParagraphSchema = SchemaFactory.createForClass(Paragraph);

import { BaseSchema } from '@/shared/schemas/base.schema';

@Schema({ timestamps: true })
export class Chapter extends BaseSchema {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Book' })
  bookId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  slug: string;

  @Prop({ type: [ParagraphSchema], required: true })
  paragraphs: Types.DocumentArray<ParagraphDocument>;

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ required: true })
  orderIndex: number;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
