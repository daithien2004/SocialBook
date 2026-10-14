import { Command } from '@nestjs/cqrs';
import { ToxicWord } from '@/modules/content-moderation/domain/entities/toxic-word.entity';

export class AddToxicWordCommand extends Command<ToxicWord> {
  constructor(
    public readonly pattern: string,
    public readonly group: string,
    public readonly originalWord?: string,
  ) {
    super();
  }
}
