import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'info',
  'success',
  'warning',
  'error',
  'system',
  'message',
  'comment',
  'reply',
  'like',
  'follow',
] as const;

import { BaseSchema } from '@/shared/schemas/base.schema';

@Schema({ timestamps: true })
export class Notification extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true, trim: true })
  message: string;

  @Prop({
    type: String,
    enum: NOTIFICATION_TYPES,
    default: 'info',
  })
  type: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  sentAt: Date | null;

  @Prop({
    type: {
      actorId: { type: Types.ObjectId, ref: 'User' },
      username: { type: String },
      image: { type: String || undefined },
      targetId: { type: Types.ObjectId },
    },
  })
  meta: {
    actorId: Types.ObjectId;
    name: string;
    avatar: string;
    targetId: Types.ObjectId;
  };

  @Prop({ type: String, default: null })
  actionUrl: string | null;
}

export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Lấy tất cả notification của user, mới nhất trước — query chính của findAllByUser
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Tự động xóa notification cũ sau 30 ngày (2,592,000 giây)
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// Đếm / lọc notification chưa đọc — dùng bởi countUnread và findAllByUser(isRead)
NotificationSchema.index({ userId: 1, isRead: 1 });

NotificationSchema.index(
  { userId: 1, type: 1, 'meta.actorId': 1, 'meta.targetId': 1 },
  { unique: true },
);
