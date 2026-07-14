import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '@/shared/schemas/base.schema';
import { UserEventType } from '@/domain/analytics/enums/user-event-type.enum';

@Schema({ timestamps: true, collection: 'user_events' })
export class UserEvent extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, index: true })
  sessionId?: string;

  @Prop({
    type: String,
    enum: Object.values(UserEventType),
    required: true,
    index: true,
  })
  eventType: UserEventType;

  @Prop({ type: Types.ObjectId, ref: 'Book', index: true })
  bookId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chapter' })
  chapterId?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  durationSeconds?: number;

  @Prop({ type: Number })
  progressPercent?: number;

  @Prop({ type: String })
  source?: string;

  @Prop({ type: String })
  deviceType?: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, unknown>;
}

export type UserEventDocument = HydratedDocument<UserEvent>;
export const UserEventSchema = SchemaFactory.createForClass(UserEvent);

UserEventSchema.index({ userId: 1, createdAt: -1 });
UserEventSchema.index({ bookId: 1, eventType: 1 });

UserEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);
