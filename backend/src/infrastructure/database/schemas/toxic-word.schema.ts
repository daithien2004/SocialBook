import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ToxicWordDocument = ToxicWord & Document;

@Schema({ timestamps: true, collection: 'toxic_words' })
export class ToxicWord {
  @Prop({ required: true, unique: true })
  pattern: string;

  @Prop({ required: true })
  group: string;

  @Prop({ required: true })
  originalWord: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ToxicWordSchema = SchemaFactory.createForClass(ToxicWord);
