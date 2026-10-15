import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export type ChapterAudioStatus =
  'pending' | 'processing' | 'completed' | 'failed';

export class UpdateChapterAudioStatusCommand extends Command<void> {
  constructor(
    public readonly actor: Actor,
    public readonly chapterId: string,
    public readonly status: ChapterAudioStatus,
    public readonly audioUrl?: string,
  ) {
    super();
  }
}
