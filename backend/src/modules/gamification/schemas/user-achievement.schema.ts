import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserAchievementDocument = HydratedDocument<UserAchievement>;

@Schema({ timestamps: true })
export class UserAchievement {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Achievement', required: true })
  achievementId: Types.ObjectId;

  @Prop({ default: Date.now })
  unlockedAt: Date;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: false })
  isNotified: boolean;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: false })
  isFavorite: boolean;
}

export const UserAchievementSchema = SchemaFactory.createForClass(UserAchievement);

UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
