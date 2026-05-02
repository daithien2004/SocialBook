export class ChangeChapterCommand {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
    public readonly chapterSlug: string,
  ) {}
}
