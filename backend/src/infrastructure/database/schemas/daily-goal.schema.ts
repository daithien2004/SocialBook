import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DailyGoalDocument = HydratedDocument<DailyGoal>;

import { BaseSchema } from '@/shared/schemas/base.schema';

@Schema({ timestamps: true })
export class DailyGoal extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({
    type: Object,
    default: {}
  })
  goals: {
    pages?: {
      target: number;
      current: number;
      completed: boolean;
    };
    minutes?: {
      target: number;
      current: number;
      completed: boolean;
    };
    chapters?: {
      target: number;
      current: number;
      completed: boolean;
    };
  };

  @Prop({ default: false })
  allGoalsMet: boolean;
}

export const DailyGoalSchema = SchemaFactory.createForClass(DailyGoal);

DailyGoalSchema.index({ userId: 1, date: 1 }, { unique: true });
