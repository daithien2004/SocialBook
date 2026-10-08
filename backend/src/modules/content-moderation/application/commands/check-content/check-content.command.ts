import { Command } from '@nestjs/cqrs';
import { ModerationResult } from '@/modules/content-moderation/domain/interfaces/moderation-result.interface';

export class CheckContentCommand extends Command<ModerationResult> {
  constructor() {
    super();
  }
}
