import {
  IsIn,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Actor } from '@/shared/casl/actor';
import { GenerateChapterAudioCommand } from '../../application/commands/generate-chapter-audio/generate-chapter-audio.command';
import { GenerateBookAudioCommand } from '../../application/commands/generate-book-audio/generate-book-audio.command';
import type { TextToSpeechReadModel } from '../../application/read-models/text-to-speech.read-model';
import type { GenerateBookAudioResult } from '../../application/text-to-speech.result';

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
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsIn(['mp3', 'wav', 'ogg'])
  format?: string;

  @IsOptional()
  @IsBoolean()
  forceRegenerate?: boolean;

  toCommand(actor: Actor, chapterId: string): GenerateChapterAudioCommand {
    return new GenerateChapterAudioCommand(
      actor,
      chapterId,
      this.forceRegenerate,
      this.voice,
      this.speed,
      this.language,
      this.format,
    );
  }
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
  @IsIn(['mp3', 'wav', 'ogg'])
  format?: string;

  @IsOptional()
  @IsBoolean()
  forceRegenerate?: boolean;

  toCommand(actor: Actor, bookId: string): GenerateBookAudioCommand {
    return new GenerateBookAudioCommand(
      actor,
      bookId,
      this.forceRegenerate,
      this.voice,
      this.speed,
      this.language,
      this.format,
    );
  }
}

export class TextToSpeechResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  chapterId!: string;

  @ApiProperty()
  bookId!: string;

  @ApiProperty()
  voice!: string;

  @ApiProperty()
  language!: string;

  @ApiProperty()
  speed!: number;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  audioUrl?: string;

  @ApiPropertyOptional()
  audioFormat?: string;

  @ApiPropertyOptional()
  audioDuration?: number;

  @ApiPropertyOptional()
  characterCount?: number;

  @ApiPropertyOptional()
  paragraphCount?: number;

  @ApiPropertyOptional()
  provider?: string;

  @ApiProperty()
  playCount!: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastPlayedAt?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  processedAt?: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  static fromReadModel(model: TextToSpeechReadModel): TextToSpeechResponseDto {
    return {
      ...model,
    } satisfies TextToSpeechResponseDto;
  }
}

export class GenerateBookAudioChapterResultDto {
  @ApiProperty()
  chapterId!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  audioUrl?: string;
}

export class GenerateBookAudioErrorDto {
  @ApiProperty()
  chapterId!: string;

  @ApiProperty()
  error!: string;
}

export class GenerateBookAudioResponseDto implements GenerateBookAudioResult {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  successful!: number;

  @ApiProperty()
  failed!: number;

  @ApiProperty({ type: [GenerateBookAudioChapterResultDto] })
  generated!: GenerateBookAudioResult['generated'];

  @ApiProperty({ type: [GenerateBookAudioErrorDto] })
  errors!: GenerateBookAudioResult['errors'];

  static fromResult(
    result: GenerateBookAudioResult,
  ): GenerateBookAudioResponseDto {
    return { ...result } satisfies GenerateBookAudioResponseDto;
  }
}
