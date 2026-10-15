import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class GenerateChapterAudioCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly chapterId: string,
    public readonly forceRegenerate?: boolean,
    public readonly voice?: string,
    public readonly speed?: number,
    public readonly language?: string,
    public readonly format?: string,
  ) {
    super();
  }
}
