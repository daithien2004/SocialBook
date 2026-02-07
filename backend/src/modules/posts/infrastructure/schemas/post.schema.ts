import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { BaseSoftDeleteSchema } from '@/src/shared/schemas/base.schema';

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

  // Keep specific field name if different from Base
  @Prop({ type: Boolean, default: false })
  isDelete: boolean;

  @Prop({ type: Boolean, default: false })
  isFlagged: boolean;

  @Prop({ type: String })
  moderationReason?: string;

  @Prop({ type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  moderationStatus?: string;
}
export type PostDocument = HydratedDocument<Post>;

export const PostSchema = SchemaFactory.createForClass(Post);

// Add index for performance
PostSchema.index({ createdAt: -1 }); // For growth and recent posts queries
