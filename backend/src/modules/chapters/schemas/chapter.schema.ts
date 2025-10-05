import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChapterDocument = Chapter & Document;

@Schema({ timestamps: true }) // tự động thêm createdAt, updatedAt
export class Chapter {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Book' })
  bookId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ required: true })
  orderIndex: number;

  // createdAt và updatedAt sẽ được mongoose tự sinh do @Schema({ timestamps: true })
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
