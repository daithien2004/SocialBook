import type { ReadingPreferences } from '@/modules/users/domain/users/value-objects/reading-preferences.vo';
import type { ReadingPreferencesReadModel } from './read-models/reading-preferences.read-model';

export type ReadingPreferencesResult = ReadingPreferencesReadModel;

export function toReadingPreferencesResult(
  preferences: ReadingPreferences,
): ReadingPreferencesResult {
  return {
    theme: preferences.theme,
    fontSize: preferences.fontSize,
    fontFamily: preferences.fontFamily,
    lineHeight: preferences.lineHeight,
    letterSpacing: preferences.letterSpacing,
    backgroundColor: preferences.backgroundColor,
    textColor: preferences.textColor,
    textAlign: preferences.textAlign,
    marginWidth: preferences.marginWidth,
    warmth: preferences.warmth,
    brightness: preferences.brightness,
    preferredGenres: preferences.preferredGenres,
    dailyReadingGoal: preferences.dailyReadingGoal,
  };
}
