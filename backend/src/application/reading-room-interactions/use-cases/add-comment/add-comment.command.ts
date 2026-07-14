export class AddCommentCommand {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
    public readonly chapterSlug: string,
    public readonly paragraphId: string,
    public readonly content: string,
    public readonly parentCommentId?: string,
  ) {}
}
