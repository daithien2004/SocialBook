import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { BaseSchema } from '@/shared/schemas/base.schema';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role extends BaseSchema {
  @Prop({ type: String, required: true, unique: true })
  name: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
