import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { TextToSpeech } from '@/domain/text-to-speech/entities/text-to-speech.entity';

export class GenerateChapterAudioDto {
  @IsOptional()
  @IsString()
  voice?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(4.0)
  speed?: number;

  @IsOptional()
  @IsNumber()
  @Min(-20)
  @Max(20)
  pitch?: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(['mp3', 'wav', 'ogg'])
  format?: string;

  @IsOptional()
  @IsBoolean()
  forceRegenerate?: boolean;
}

export class GenerateBookAudioDto {
  @IsOptional()
  @IsString()
  voice?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(4.0)
  speed?: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(['mp3', 'wav', 'ogg'])
  format?: string;

  @IsOptional()
  @IsBoolean()
  forceRegenerate?: boolean;
}

export class TextToSpeechResponseDto {
  static fromEntity(entity: TextToSpeech) {
    if (!entity) return null;
    return {
      id: entity.id,
      chapterId: entity.chapterId,
      bookId: entity.bookId,
      text: entity.text,
      voice: entity.voice,
      language: entity.language,
      speed: entity.speed,
      status: entity.status,
      audioUrl: entity.audioUrl,
      audioFormat: entity.audioFormat,
      audioDuration: entity.audioDuration,
      characterCount: entity.characterCount,
      paragraphCount: entity.paragraphCount,
      errorMessage: entity.errorMessage,
      provider: entity.provider,
      playCount: entity.playCount,
      lastPlayedAt: entity.lastPlayedAt,
      processedAt: entity.processedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
