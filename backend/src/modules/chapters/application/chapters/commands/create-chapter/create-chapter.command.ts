import { Command } from '@nestjs/cqrs';

import { ChapterResult } from '@/modules/chapters/application/chapters/queries/get-chapters/get-chapters.result';

export class CreateChapterCommand extends Command<ChapterResult> {
  constructor(
    public readonly title: string,
    public readonly bookId: string,
    public readonly paragraphs: Array<{ id?: string; content: string }>,
    public readonly slug?: string,
    public readonly orderIndex?: number,
  ) {
    super();
  }
}
