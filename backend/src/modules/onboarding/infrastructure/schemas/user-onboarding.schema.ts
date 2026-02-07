import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserOnboardingDocument = HydratedDocument<UserOnboarding>;

@Schema({ timestamps: true })
export class UserOnboarding {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: 1 })
  currentStep: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Genre' }] })
  favoriteGenres: Types.ObjectId[];

  @Prop({
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  })
  readingGoalType: string;

  @Prop({ default: 0 })
  readingGoalTarget: number;

  @Prop({
    type: String,
    enum: ['pages', 'minutes', 'books'],
    default: 'pages',
  })
  readingGoalUnit: string;

  @Prop({ type: Object })
  readingTime: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    night: boolean;
    weekend: boolean;
  };

  @Prop()
  completedAt: Date;
}

export const UserOnboardingSchema = SchemaFactory.createForClass(UserOnboarding);
