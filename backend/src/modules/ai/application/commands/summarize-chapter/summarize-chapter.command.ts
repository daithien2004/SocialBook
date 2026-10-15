import { Command } from '@nestjs/cqrs';

import type { Actor } from '@/shared/casl/actor';
import type { SummarizeChapterResult } from '@/modules/ai/application/ai.result';

export class SummarizeChapterCommand extends Command<SummarizeChapterResult> {
  constructor(
    public readonly chapterId: string,
    public readonly actor: Actor,
  ) {
    super();
  }
}
