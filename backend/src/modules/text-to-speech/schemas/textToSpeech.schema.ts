import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TextToSpeech extends Document {

  @Prop()
  text: string;

  @Prop()
  voice: string;

  @Prop()
  audioUrl: string; 
}

export type TextToSpeechDocument = TextToSpeech & Document;
export const TextToSpeechSchema = SchemaFactory.createForClass(TextToSpeech);
 