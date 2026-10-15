import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class RecordChapterViewCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly bookSlug: string,
    public readonly chapterSlug: string,
    public readonly userId?: string | null,
    public readonly clientIp?: string | null,
  ) {
    super();
  }
}
