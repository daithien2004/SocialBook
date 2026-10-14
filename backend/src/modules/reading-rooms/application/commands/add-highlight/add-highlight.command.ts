import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class AddHighlightCommand extends Command<string> {
  constructor(
    public readonly roomId: string,
    public readonly actor: Actor,
    public readonly chapterSlug: string,
    public readonly paragraphId: string,
    public readonly content: string,
    public readonly displayName?: string,
    public readonly avatarUrl?: string,
  ) {
    super();
  }
}
