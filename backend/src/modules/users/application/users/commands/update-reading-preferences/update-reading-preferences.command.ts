import { Command } from '@nestjs/cqrs';
import type { ReadingPreferencesResult } from '@/modules/users/application/reading-preferences.result';
import type { Actor } from '@/shared/casl/actor';

export class UpdateReadingPreferencesCommand extends Command<ReadingPreferencesResult> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly theme?: string,
    public readonly fontSize?: number,
    public readonly fontFamily?: string,
    public readonly lineHeight?: number,
    public readonly letterSpacing?: number,
    public readonly backgroundColor?: string,
    public readonly textColor?: string,
    public readonly textAlign?: string,
    public readonly marginWidth?: number,
    public readonly warmth?: number,
    public readonly brightness?: number,
    public readonly preferredGenres?: string[],
    public readonly dailyReadingGoal?: number,
  ) {
    super();
  }
}
