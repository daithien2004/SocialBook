import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LeaderboardDocument = HydratedDocument<Leaderboard>;

@Schema({ timestamps: true })
export class Leaderboard {
  @Prop({
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'all-time'],
    required: true
  })
  period: string;

  @Prop({
    type: String,
    enum: ['pages', 'books', 'streak'],
    required: true
  })
  category: string;

  @Prop({
    type: [{
      userId: { type: Types.ObjectId, ref: 'User' },
      rank: Number,
      value: Number,
      change: Number
    }]
  })
  rankings: {
    userId: Types.ObjectId;
    rank: number;
    value: number;
    change: number;
  }[];

  @Prop({ default: Date.now })
  generatedAt: Date;

  @Prop()
  expiresAt: Date;
}

export const LeaderboardSchema = SchemaFactory.createForClass(Leaderboard);

LeaderboardSchema.index({ period: 1, category: 1 });
