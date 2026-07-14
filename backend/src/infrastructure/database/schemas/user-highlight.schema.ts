import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '@/shared/schemas/base.schema';

export type UserHighlightDocument = HydratedDocument<UserHighlight>;

@Schema({ timestamps: true, collection: 'user_highlights' })
export class UserHighlight extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true, index: true })
  bookId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chapter', required: true })
  chapterId: Types.ObjectId;

  @Prop({ required: true })
  paragraphId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: '#ffeb3b' })
  color: string;

  @Prop({ required: false })
  note?: string;
}

export const UserHighlightSchema = SchemaFactory.createForClass(UserHighlight);

// Ensure a user can highlight the same paragraph multiple times if they select different text
// But maybe we just index userId and bookId for fast querying
UserHighlightSchema.index({ userId: 1, bookId: 1 });
UserHighlightSchema.index({ userId: 1, chapterId: 1 });
