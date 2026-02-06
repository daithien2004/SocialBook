import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TTSStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TTSVoiceType {
  MALE = 'male',
  FEMALE = 'female',
  NEUTRAL = 'neutral',
}

import { BaseSchema } from '@/src/shared/schemas/base.schema';

@Schema({ timestamps: true })
export class TextToSpeech extends BaseSchema {
  // References
  @Prop({ type: Types.ObjectId, required: true, ref: 'Chapter', index: true })
  chapterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Book', index: true })
  bookId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId; // User who requested the TTS (optional for tracking)

  // Content
  @Prop({ required: true, type: String })
  text: string; // Combined text from all paragraphs of the chapter

  @Prop({ type: Number })
  paragraphCount: number; // Number of paragraphs in the chapter

  // Voice Configuration
  @Prop({ required: true, default: 'en-US-Neural2-J' })
  voice: string; // Voice ID from TTS provider (e.g., Google Cloud TTS, AWS Polly)

  @Prop({
    type: String,
    enum: Object.values(TTSVoiceType),
    default: TTSVoiceType.NEUTRAL
  })
  voiceType: TTSVoiceType;

  @Prop({ type: Number, default: 1.0, min: 0.25, max: 4.0 })
  speed: number; // Speaking rate (0.25 to 4.0)

  @Prop({ type: Number, default: 0, min: -20, max: 20 })
  pitch: number; // Voice pitch adjustment (-20 to 20 semitones)

  @Prop({ type: Number, default: 0, min: -96, max: 16 })
  volumeGainDb: number; // Volume gain in decibels

  // Language
  @Prop({ required: true, default: 'vi-VN' })
  language: string; // Language code (e.g., 'vi-VN', 'en-US')

  // Audio Output
  @Prop({ type: String })
  audioUrl: string; // URL to the generated audio file

  @Prop({ type: String })
  audioFormat: string; // Audio format (e.g., 'mp3', 'wav', 'ogg')

  @Prop({ type: Number })
  audioDuration: number; // Duration in seconds

  @Prop({ type: Number })
  audioSize: number; // File size in bytes

  // Status and Processing
  @Prop({
    type: String,
    enum: Object.values(TTSStatus),
    default: TTSStatus.PENDING,
    index: true
  })
  status: TTSStatus;

  @Prop({ type: Date })
  processedAt?: Date; // When the TTS generation was completed

  @Prop({ type: String })
  errorMessage?: string; // Error message if status is FAILED

  @Prop({ type: Object })
  errorDetails?: any; // Additional error details for debugging

  // Caching and Expiry
  @Prop({ type: Date })
  expiresAt?: Date; // When this TTS audio should be deleted (for cleanup)

  @Prop({ type: Number, default: 0 })
  playCount: number; // How many times this audio has been played

  @Prop({ type: Date })
  lastPlayedAt?: Date; // Last time the audio was played

  // Metadata
  @Prop({ type: String })
  provider?: string; // TTS provider used (e.g., 'google', 'aws', 'azure')

  @Prop({ type: Number })
  characterCount: number; // Total characters processed (for billing/tracking)

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Additional flexible metadata
}

export type TextToSpeechDocument = TextToSpeech & Document;
export const TextToSpeechSchema = SchemaFactory.createForClass(TextToSpeech);

// Compound indexes for efficient queries
TextToSpeechSchema.index({ chapterId: 1, language: 1, voice: 1 });
TextToSpeechSchema.index({ bookId: 1, status: 1 });
TextToSpeechSchema.index({ userId: 1, createdAt: -1 });
TextToSpeechSchema.index({ status: 1, createdAt: -1 });
TextToSpeechSchema.index({ expiresAt: 1 }, { sparse: true }); // For TTL cleanup