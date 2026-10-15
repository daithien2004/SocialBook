import { Command } from '@nestjs/cqrs';

import { ChapterReadModel } from '@/modules/chapters/application/read-models/chapter.read-model';
import type { Actor } from '@/shared/casl/actor';

export class CreateChapterCommand extends Command<ChapterReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly title: string,
    public readonly bookId: string,
    public readonly paragraphs: Array<{ id?: string; content: string }>,
    public readonly slug?: string,
    public readonly orderIndex?: number,
  ) {
    super();
  }
}
