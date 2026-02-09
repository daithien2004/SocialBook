import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { BaseSoftDeleteSchema } from '@/shared/schemas/base.schema';

export type BookDocument = Book & Document;

@Schema({ timestamps: true }) // tự sinh createdAt, updatedAt
export class Book extends BaseSoftDeleteSchema {
  @Prop({ type: Types.ObjectId, ref: 'Author', required: true })
  authorId: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Genre' }],
    default: [],
  })
  genres: Types.ObjectId[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Chapter' }],
    default: [],
  })
  chapters: Types.ObjectId[];

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

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likedBy: Types.ObjectId[];
}

export const BookSchema = SchemaFactory.createForClass(Book);


BookSchema.index({ status: 1, isDeleted: 1, updatedAt: -1 });
BookSchema.index({ title: 'text', slug: 'text' });
BookSchema.index({ genres: 1 });
BookSchema.index({ tags: 1 });
BookSchema.index({ authorId: 1 });
BookSchema.index({ createdAt: -1 });
BookSchema.index({ views: -1 });
BookSchema.index({ slug: 1 });
BookSchema.index({ likes: -1 });
