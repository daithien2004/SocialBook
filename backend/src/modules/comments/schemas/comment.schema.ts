import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { COMMENT_TARGET_TYPES } from '@/src/modules/comments/constants/comment.constant';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: COMMENT_TARGET_TYPES, required: true })
  targetType: string;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  parentId: Types.ObjectId | null;

  @Prop({ type: String, required: true, trim: true })
  content: string;

  @Prop({ type: Number, default: 0 })
  likesCount: number;

  @Prop({
    type: Number,
    min: 1,
    max: 5,
    default: 5
  })
  rating: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}


export type CommentDocument = HydratedDocument<Comment>;
export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.virtual('id').get(function () {
  return this._id.toString();
});