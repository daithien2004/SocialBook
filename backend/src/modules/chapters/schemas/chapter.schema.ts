import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChapterDocument = Chapter & Document;

class Paragraph {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  content: string;
}

@Schema({ timestamps: true }) // tự động thêm createdAt, updatedAt
export class Chapter {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Book' })
  bookId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    index: true, // Để query nhanh
  })
  slug: string;

  @Prop({ type: [Paragraph], required: true })
  paragraphs: Paragraph[];

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ required: true })
  orderIndex: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
