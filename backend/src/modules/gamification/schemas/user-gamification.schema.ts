import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserGamificationDocument = HydratedDocument<UserGamification>;

@Schema({ timestamps: true })
export class UserGamification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // Streak System
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

  // Daily Stats (Embedded array or separate collection? User requested embedded)
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

  // Totals
  @Prop({ default: 0 })
  totalPagesRead: number;

  @Prop({ default: 0 })
  totalMinutesRead: number;

  @Prop({ default: 0 })
  totalBooksCompleted: number;

  @Prop({ default: 0 })
  totalChaptersRead: number;

  // Achievements
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Achievement' }] })
  achievementIds: Types.ObjectId[];

  // Leaderboard Ranks (Cached)
  @Prop({ default: 0 })
  weeklyRank: number;

  @Prop({ default: 0 })
  monthlyRank: number;

  @Prop({ default: 0 })
  allTimeRank: number;
}

export const UserGamificationSchema = SchemaFactory.createForClass(UserGamification);

UserGamificationSchema.index({ userId: 1 });

