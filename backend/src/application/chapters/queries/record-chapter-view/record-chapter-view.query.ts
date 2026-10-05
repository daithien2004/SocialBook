import { Query } from '@nestjs/cqrs';

export class RecordChapterViewQuery extends Query<void> {
  constructor(
    public readonly bookSlug: string,
    public readonly chapterSlug: string,
    public readonly userId?: string | null,
    public readonly clientIp?: string | null,
  ) {
    super();
  }
}
