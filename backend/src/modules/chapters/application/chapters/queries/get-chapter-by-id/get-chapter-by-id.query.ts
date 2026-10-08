import { Query } from '@nestjs/cqrs';

import { ChapterResult } from '@/modules/chapters/application/chapters/queries/get-chapters/get-chapters.result';

export class GetChapterByIdQuery extends Query<ChapterResult> {
  constructor(public readonly id: string) {
    super();
  }
}
