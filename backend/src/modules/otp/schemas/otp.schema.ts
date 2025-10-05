import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class OTP extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true })
  expiry: Date;
}

export const OTPSchema = SchemaFactory.createForClass(OTP);
