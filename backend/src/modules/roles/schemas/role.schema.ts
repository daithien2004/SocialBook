import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  name: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
