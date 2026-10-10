import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserRoleChangeOutboxDocument =
  HydratedDocument<UserRoleChangeOutboxRecord>;

@Schema({ timestamps: true, collection: 'user_role_change_outbox' })
export class UserRoleChangeOutboxRecord {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  roleId!: string;

  @Prop({
    required: true,
    default: 'pending',
    enum: ['pending', 'processing', 'published'],
  })
  status!: string;

  @Prop({ type: Date, default: null })
  leaseUntil!: Date | null;

  @Prop({ type: Date, default: Date.now })
  availableAt!: Date;

  @Prop({ type: Date, default: null })
  publishedAt!: Date | null;

  @Prop({ default: 0 })
  attempts!: number;
}

export const UserRoleChangeOutboxSchema = SchemaFactory.createForClass(
  UserRoleChangeOutboxRecord,
);
UserRoleChangeOutboxSchema.index({ status: 1, availableAt: 1, createdAt: 1 });
UserRoleChangeOutboxSchema.index({ status: 1, leaseUntil: 1, createdAt: 1 });
UserRoleChangeOutboxSchema.index(
  { publishedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { status: 'published' },
  },
);
