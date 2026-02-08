import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TTSStatus, TTSVoiceType } from '@/domain/text-to-speech/entities/text-to-speech.entity';

export { TTSStatus, TTSVoiceType };

export type TextToSpeechDocument = TextToSpeech & Document;

@Schema({ timestamps: true })
export class TextToSpeech {
  @Prop({ type: Types.ObjectId, ref: 'Chapter', required: true, index: true })
  chapterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true, index: true })
  bookId: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  voice: string;

  @Prop({ required: true })
  language: string;

  @Prop({ default: 1.0 })
  speed: number;

  @Prop({ type: String, enum: TTSStatus, default: TTSStatus.PENDING, index: true })
  status: TTSStatus;

  @Prop()
  audioUrl?: string;

  @Prop({ default: 'mp3' })
  audioFormat?: string;

  @Prop()
  audioDuration?: number;

  @Prop()
  characterCount?: number;

  @Prop()
  paragraphCount?: number;

  @Prop()
  errorMessage?: string;

  @Prop()
  provider?: string;

  @Prop({ default: 0 })
  playCount: number;

  @Prop()
  lastPlayedAt?: Date;
  
  @Prop()
  processedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const TextToSpeechSchema = SchemaFactory.createForClass(TextToSpeech);

