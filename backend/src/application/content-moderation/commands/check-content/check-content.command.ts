import { Command } from '@nestjs/cqrs';
import { ModerationResult } from '@/domain/content-moderation/interfaces/moderation-result.interface';

export class CheckContentCommand extends Command<ModerationResult> {
  constructor() {
    super();
  }
}
