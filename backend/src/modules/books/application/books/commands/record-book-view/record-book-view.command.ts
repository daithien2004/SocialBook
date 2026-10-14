import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class RecordBookViewCommand extends Command<void> {
  public readonly slug: string;
  public readonly actor: Actor;

  constructor(actor: Actor, slug: string) {
    super();
    this.actor = actor;
    this.slug = slug;
  }
}
