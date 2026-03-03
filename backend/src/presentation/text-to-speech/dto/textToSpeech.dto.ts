import { IsEnum, IsOptional, IsString, IsNumber, Min, Max, IsBoolean } from 'class-validator';

export class TextToSpeechDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsEnum(["en-us", "en-gb", "en-au", "vi-vn"], {
    message: "voice must be one of: en-us, en-gb, en-au, vi-vn",
  })
  voice: string = "en-au";

  @IsOptional()
  @IsEnum(["mp3", "wav", "ogg"], {
    message: "format must be one of: mp3, wav, ogg",
  })
  format: string = "mp3";
}

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
  @IsEnum(["mp3", "wav", "ogg"])
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
  @IsEnum(["mp3", "wav", "ogg"])
  format?: string;

  @IsOptional()
  @IsBoolean()
  forceRegenerate?: boolean;
}
