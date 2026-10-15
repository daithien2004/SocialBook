import { Query } from '@nestjs/cqrs';

import { ReadingProgressResult } from '@/modules/library/application/library/dto/library.dto';
import type { Actor } from '@/shared/casl/actor';

export class GetChapterProgressQuery extends Query<ReadingProgressResult | null> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
  ) {
    super();
  }
}
