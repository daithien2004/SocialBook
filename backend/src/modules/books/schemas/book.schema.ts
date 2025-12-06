import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Date, Document, Types } from 'mongoose';

export type BookDocument = Book & Document;

@Schema({ timestamps: true }) // tự sinh createdAt, updatedAt
export class Book {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Author', required: true })
  authorId: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Genre' }],
    default: [],
  })
  genres: Types.ObjectId[];

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

  @Prop({ default: false })
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const BookSchema = SchemaFactory.createForClass(Book);

// Add indexes for performance
BookSchema.index({ createdAt: -1 }); // For growth queries
BookSchema.index({ views: -1 }); // For popular books queries
BookSchema.index({ slug: 1 }); // For book lookups
BookSchema.index({ tags: 1 });
