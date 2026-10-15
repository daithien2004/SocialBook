import { Command } from '@nestjs/cqrs';
import { ModerationResult } from '@/modules/content-moderation/domain/interfaces/moderation-result.interface';
import type { Actor } from '@/shared/casl/actor';

export class CheckContentCommand extends Command<ModerationResult> {
  constructor(
    public readonly actor: Actor,
    public readonly content: string,
  ) {
    super();
  }
}
