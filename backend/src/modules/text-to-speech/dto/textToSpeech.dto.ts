import { IsEnum, IsOptional, IsString } from 'class-validator';

export class TextToSpeechDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsEnum(["en-us", "en-gb", "en-au", "vi-vn"], {
    message: "voice must be one of: en-us, en-gb, en-au, vi-vn",
  })
  voice: string = "vi-vn";

  @IsOptional()
  @IsEnum(["mp3", "wav", "ogg"], {
    message: "format must be one of: mp3, wav, ogg",
  })
  format: string = "mp3";
}
