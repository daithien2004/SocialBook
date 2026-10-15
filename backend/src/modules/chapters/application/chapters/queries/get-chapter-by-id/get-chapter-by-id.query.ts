import { Query } from '@nestjs/cqrs';

import { ChapterReadModel } from '@/modules/chapters/application/read-models/chapter.read-model';
import type { Actor } from '@/shared/casl/actor';

export class GetChapterByIdQuery extends Query<ChapterReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly id: string,
  ) {
    super();
  }
}
