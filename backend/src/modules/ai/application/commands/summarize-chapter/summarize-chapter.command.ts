import { Command } from '@nestjs/cqrs';

import { SummarizeChapterResult } from '@/modules/ai/application/commands/summarize-chapter/summarize-chapter.handler';

export class SummarizeChapterCommand extends Command<SummarizeChapterResult> {
  constructor(
    public readonly chapterId: string,
    public readonly userId: string,
  ) {
    super();
  }
}
