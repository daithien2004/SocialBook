export class CreateBookmarkCommand {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly chapterSlug: string,
    public readonly paragraphId: string,
    public readonly textPreview: string,
  ) {}
}
