import { ApiProperty } from '@nestjs/swagger';
import type { ReadingPreferencesReadModel } from '@/modules/users/application/read-models/reading-preferences.read-model';
import type { ReadingPreferencesResult } from '@/modules/users/application/reading-preferences.result';

export class ReadingPreferencesResponseDto {
  @ApiProperty()
  theme!: string;

  @ApiProperty()
  fontSize!: number;

  @ApiProperty()
  fontFamily!: string;

  @ApiProperty()
  lineHeight!: number;

  @ApiProperty()
  letterSpacing!: number;

  @ApiProperty()
  backgroundColor!: string;

  @ApiProperty()
  textColor!: string;

  @ApiProperty()
  textAlign!: string;

  @ApiProperty()
  marginWidth!: number;

  @ApiProperty()
  warmth!: number;

  @ApiProperty()
  brightness!: number;

  @ApiProperty({ type: [String] })
  preferredGenres!: string[];

  @ApiProperty()
  dailyReadingGoal!: number;

  static fromReadModel(
    preferences: ReadingPreferencesReadModel,
  ): ReadingPreferencesResponseDto {
    return this.fromPreferences(preferences);
  }

  static fromResult(
    preferences: ReadingPreferencesResult,
  ): ReadingPreferencesResponseDto {
    return this.fromPreferences(preferences);
  }

  private static fromPreferences(
    preferences: ReadingPreferencesReadModel,
  ): ReadingPreferencesResponseDto {
    const dto = new ReadingPreferencesResponseDto();
    dto.theme = preferences.theme;
    dto.fontSize = preferences.fontSize;
    dto.fontFamily = preferences.fontFamily;
    dto.lineHeight = preferences.lineHeight;
    dto.letterSpacing = preferences.letterSpacing;
    dto.backgroundColor = preferences.backgroundColor;
    dto.textColor = preferences.textColor;
    dto.textAlign = preferences.textAlign;
    dto.marginWidth = preferences.marginWidth;
    dto.warmth = preferences.warmth;
    dto.brightness = preferences.brightness;
    dto.preferredGenres = preferences.preferredGenres;
    dto.dailyReadingGoal = preferences.dailyReadingGoal;
    return dto;
  }
}
