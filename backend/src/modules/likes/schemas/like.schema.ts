import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TARGET_TYPES } from '@/src/modules/comments/constants/targetType.constant';

@Schema({ timestamps: true })
export class Like {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: TARGET_TYPES, required: true })
  targetType: string;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'targetType' })
  targetId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export type LikeDocument = HydratedDocument<Like>;
export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
