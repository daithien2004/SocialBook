import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AchievementDocument = HydratedDocument<Achievement>;

@Schema({ timestamps: true })
export class Achievement {
  @Prop({ required: true, unique: true, trim: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  iconUrl: string;

  @Prop({
    type: String,
    enum: ['reading', 'streak', 'social', 'special'],
    required: true
  })
  category: string;

  @Prop({
    type: Object,
    required: true
  })
  requirement: {
    type: 'books_completed' | 'pages_read' | 'streak_days' | 'reviews_written' | 'custom';
    value: number;
    condition?: string; // JSON logic string if needed
  };

  @Prop()
  badgeUrl: string;

  @Prop({
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  })
  rarity: string;

  @Prop({ default: 0 })
  unlockedByCount: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);
