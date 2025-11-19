import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChapterDocument = Chapter & Document;

// Interface cho Paragraph với _id
export interface ParagraphDocument {
  _id: Types.ObjectId;
  content: string;
}

@Schema({ _id: true }) // Bật tự động tạo _id
class Paragraph {
  // Không cần khai báo _id ở đây, MongoDB tự thêm

  @Prop({ required: true })
  content: string;
}

const ParagraphSchema = SchemaFactory.createForClass(Paragraph);

@Schema({ timestamps: true })
export class Chapter {
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

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);