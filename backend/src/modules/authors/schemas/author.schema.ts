import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuthorDocument = Author & Document;

@Schema({ timestamps: true })
export class Author {
  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop()
  bio: string;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);
