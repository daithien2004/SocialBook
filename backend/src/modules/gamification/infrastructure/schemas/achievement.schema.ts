import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AchievementDocument = HydratedDocument<Achievement>;

import { BaseSchema } from '@/src/shared/schemas/base.schema';

@Schema({ timestamps: true })
export class Achievement extends BaseSchema {
  @Prop({ required: true, unique: true, trim: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: String,
    enum: ['reading', 'streak', 'social', 'special', 'onboarding'],
    required: true
  })
  category: string;

  @Prop({
    type: Object,
    required: true
  })
  requirement: {
    type: 'books_completed' | 'pages_read' | 'streak_days' | 'reviews_written' | 'custom' | 'onboarding';
    value: number;
    condition?: string;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);
