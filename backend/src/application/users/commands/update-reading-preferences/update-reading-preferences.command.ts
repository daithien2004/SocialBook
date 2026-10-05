import { Command } from '@nestjs/cqrs';
import { User } from '@/domain/users/entities/user.entity';

export class UpdateReadingPreferencesCommand extends Command<User> {
  constructor(
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
