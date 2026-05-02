export class AddHighlightCommand {
  constructor(
    public readonly roomId: string,
    public readonly userId: string,
    public readonly chapterSlug: string,
    public readonly paragraphId: string,
    public readonly content: string,
  ) {}
}
