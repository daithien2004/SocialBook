import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '@/shared/schemas/base.schema';

@Schema({ timestamps: true, collection: 'user_preferences' })
export class UserPreference extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Genre', required: true })
  genreId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  score: number;
}

export type UserPreferenceDocument = HydratedDocument<UserPreference>;
export const UserPreferenceSchema = SchemaFactory.createForClass(UserPreference);

UserPreferenceSchema.index({ userId: 1, genreId: 1 }, { unique: true });
UserPreferenceSchema.index({ userId: 1, score: -1 });
