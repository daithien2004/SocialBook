import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const TARGET_TYPES = [
  'post',
  'chapter',
  'paragraph',
  'comment',
] as const;

import { BaseSoftDeleteSchema } from '@/shared/schemas/base.schema';

@Schema({ timestamps: true })
export class Comment extends BaseSoftDeleteSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: TARGET_TYPES, required: true })
  targetType: string;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  parentId: Types.ObjectId | null;

  @Prop({ type: String, required: true, trim: true })
  content: string;

  @Prop({ type: Number, default: 0 })
  likesCount: number;

  @Prop({ type: Boolean, default: false })
  isFlagged: boolean;

  @Prop({ type: String })
  moderationReason?: string;

  @Prop({ type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  moderationStatus?: string;
}


export type CommentDocument = HydratedDocument<Comment>;
export const CommentSchema = SchemaFactory.createForClass(Comment);

// Lấy comment theo target (post/chapter...), lọc soft-delete, sắp xếp mới nhất
CommentSchema.index({ targetId: 1, targetType: 1, createdAt: -1 }, { partialFilterExpression: { isDeleted: false } });

// Lấy replies theo comment cha
CommentSchema.index({ parentId: 1 }, { partialFilterExpression: { isDeleted: false } });

// Lấy comment của 1 user
CommentSchema.index({ userId: 1 }, { partialFilterExpression: { isDeleted: false } });

// Admin: lọc theo trạng thái kiểm duyệt
CommentSchema.index({ moderationStatus: 1, createdAt: -1 }, { partialFilterExpression: { isDeleted: false } });