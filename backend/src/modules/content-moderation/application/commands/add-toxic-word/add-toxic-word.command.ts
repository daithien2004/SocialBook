import { Command } from '@nestjs/cqrs';
import type { ToxicWordResult } from '@/modules/content-moderation/application/toxic-word.result';
import type { Actor } from '@/shared/casl/actor';

export class AddToxicWordCommand extends Command<ToxicWordResult> {
  constructor(
    public readonly actor: Actor,
    public readonly pattern: string,
    public readonly group: string,
    public readonly originalWord?: string,
  ) {
    super();
  }
}
