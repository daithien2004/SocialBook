export class RecordChapterViewQuery {
  constructor(
    public readonly bookSlug: string,
    public readonly chapterSlug: string,
    public readonly userId?: string | null,
    public readonly clientIp?: string | null,
  ) {}
}
