import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { BaseSoftDeleteSchema } from '@/shared/schemas/base.schema';
import { ModerationStatus } from '@/domain/posts/enums/moderation-status.enum';

@Schema({ timestamps: true })
export class Post extends BaseSoftDeleteSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book' })
  bookId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  content: string;

  @Prop({ type: [String], default: [] })
  imageUrls: string[];

  @Prop({ type: Boolean, default: false })
  isFlagged: boolean;

  @Prop({ type: String })
  moderationReason?: string;

  @Prop({
    type: String,
    enum: Object.values(ModerationStatus),
    default: ModerationStatus.PENDING,
  })
  moderationStatus?: ModerationStatus;
}
export type PostDocument = HydratedDocument<Post>;

export const PostSchema = SchemaFactory.createForClass(Post);

// Add index for performance
PostSchema.index(
  { createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } },
); // For growth and recent posts queries
PostSchema.index(
  { userId: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } },
); // Optimize standard user feed lookup
PostSchema.index(
  { bookId: 1 },
  { partialFilterExpression: { isDeleted: false, bookId: { $ne: null } } },
); // Optimize book-specific post lookups
