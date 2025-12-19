import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserGamificationDocument = HydratedDocument<UserGamification>;

@Schema({ timestamps: true })
export class UserGamification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  longestStreak: number;

  @Prop()
  lastReadDate: Date;

  @Prop()
  streakStartDate: Date;

  @Prop({ default: 0 })
  streakFreezeCount: number;

  @Prop({
    type: [{
      date: Date,
      pagesRead: Number,
      minutesRead: Number,
      chaptersCompleted: Number,
      goalMet: Boolean
    }],
    default: []
  })
  dailyStats: {
    date: Date;
    pagesRead: number;
    minutesRead: number;
    chaptersCompleted: number;
    goalMet: boolean;
  }[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Achievement' }] })
  achievementIds: Types.ObjectId[];
}

export const UserGamificationSchema = SchemaFactory.createForClass(UserGamification);

UserGamificationSchema.index({ userId: 1 });

