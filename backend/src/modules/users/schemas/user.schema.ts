import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId: Types.ObjectId;

  @Prop({ unique: true, required: true, trim: true })
  username: string;

  @Prop({ unique: true, required: true })
  email: string;

  // ✅ Password là OPTIONAL (cho OAuth users)
  @Prop({ required: false })
  password?: string;

  @Prop({ default: false })
  isVerified: boolean;

  // Thêm field để phân biệt loại đăng nhập
  @Prop({
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local',
  })
  provider: string;

  // Lưu providerId (Google ID, Facebook ID, etc.)
  @Prop({ required: false })
  providerId?: string;

  @Prop()
  image?: string;

  @Prop()
  hashedRt?: string; // lưu refresh token hash
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);