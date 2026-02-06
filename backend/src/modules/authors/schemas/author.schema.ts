import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { BaseSchema } from '@/src/shared/schemas/base.schema';

export type AuthorDocument = Author & Document;

@Schema({ timestamps: true })
export class Author extends BaseSchema {
  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop()
  bio: string;

  @Prop()
  photoUrl: string;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);
