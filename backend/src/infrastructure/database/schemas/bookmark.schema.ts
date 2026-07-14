import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';
import { BaseSchema } from '@/shared/schemas/base.schema';

@Schema({ timestamps: true, collection: 'bookmarks' })
export class Bookmark extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true, index: true })
  bookId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chapter', required: true })
  chapterId: Types.ObjectId;

  @Prop({ required: true })
  chapterSlug: string;

  @Prop({ required: true })
  paragraphId: string;

  @Prop({ required: true })
  textPreview: string;
}

export type BookmarkDocument = HydratedDocument<Bookmark>;
export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

// 1 user only has 1 bookmark per paragraph
BookmarkSchema.index({ userId: 1, paragraphId: 1 }, { unique: true });
BookmarkSchema.index({ userId: 1, bookId: 1 });
