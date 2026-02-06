import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TARGET_TYPES } from '@/src/modules/comments/constants/targetType.constant';

import { BaseSchema } from '@/src/shared/schemas/base.schema';

@Schema({ timestamps: true })
export class Like extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: TARGET_TYPES, required: true })
  targetType: string;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ required: true })
  status: boolean;
}

export type LikeDocument = HydratedDocument<Like>;
export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
