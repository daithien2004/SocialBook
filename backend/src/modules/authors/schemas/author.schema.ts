import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuthorDocument = Author & Document;

@Schema({ timestamps: true })
export class Author {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop()
  bio: string;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);
