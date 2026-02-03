import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/src/shared/schemas/base.schema';

@Schema({ timestamps: true })
export class User extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId: Types.ObjectId;

  @Prop({ unique: true, required: true, trim: true })
  username: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: false })
  password?: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop({
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local',
  })
  provider: string;

  @Prop({ required: false })
  providerId?: string;

  @Prop()
  image?: string;

  @Prop({ type: String, trim: true })
  bio?: string;

  @Prop({ type: String, trim: true })
  location?: string;

  @Prop({ type: String, trim: true })
  website?: string;

  @Prop()
  hashedRt?: string; // lưu refresh token hash

  // Gamification & Onboarding
  @Prop({ type: Types.ObjectId, ref: 'UserGamification' })
  gamificationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserOnboarding' })
  onboardingId?: Types.ObjectId;

  @Prop({ default: false })
  onboardingCompleted: boolean;

  // Reading Preferences (Embedded Document)
  @Prop({
    type: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'sepia'],
        default: 'dark',
      },
      fontSize: { type: Number, default: 18, min: 12, max: 32 },
      fontFamily: { type: String, default: 'Georgia, serif' },
      lineHeight: { type: Number, default: 1.8, min: 1.2, max: 2.5 },
      letterSpacing: { type: Number, default: 0.5, min: -2, max: 5 },
      backgroundColor: { type: String, default: '#1a1a1a' },
      textColor: { type: String, default: '#e5e5e5' },
      textAlign: {
        type: String,
        enum: ['left', 'center', 'justify'],
        default: 'justify',
      },
      marginWidth: { type: Number, default: 0, min: 0, max: 100 },
    },
    default: {},
  })
  readingPreferences?: {
    theme: string;
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    letterSpacing: number;
    backgroundColor: string;
    textColor: string;
    textAlign: string;
    marginWidth: number;
  };
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ createdAt: -1 });
UserSchema.index({ provider: 1 });