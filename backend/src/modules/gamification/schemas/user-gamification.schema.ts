import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserGamificationDocument = HydratedDocument<UserGamification>;

import { BaseSchema } from '@/src/shared/schemas/base.schema';

@Schema({ timestamps: true })
export class UserGamification extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  longestStreak: number;

  @Prop()
  lastReadDate: Date;

  @Prop({ default: 2 })
  streakFreezeCount: number;
}

export const UserGamificationSchema = SchemaFactory.createForClass(UserGamification);

UserGamificationSchema.index({ userId: 1 });

