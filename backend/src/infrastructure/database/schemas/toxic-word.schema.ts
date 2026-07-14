import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'toxic_words' })
export class ToxicWordDocument extends Document {
  @Prop({ required: true, unique: true })
  pattern: string;

  @Prop({ required: true })
  group: string;

  @Prop({ required: true })
  originalWord: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ToxicWordSchema = SchemaFactory.createForClass(ToxicWordDocument);
