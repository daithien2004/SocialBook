import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookDocument = Book & Document;

@Schema({ timestamps: true }) // tự sinh createdAt, updatedAt
export class Book {
  @Prop({ type: Types.ObjectId, ref: 'Author', required: true })
  authorId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Genre', default: [] })
  genre: Types.ObjectId[];

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  slug: string;

  @Prop()
  publishedYear: string;

  @Prop()
  description: string;

  @Prop()
  coverUrl: string;

  @Prop({ enum: ['draft', 'published', 'completed'], default: 'draft' })
  status: string;

  @Prop()
  tags: string[];

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: false })
  isDeleted: boolean;
}


export const BookSchema = SchemaFactory.createForClass(Book);
