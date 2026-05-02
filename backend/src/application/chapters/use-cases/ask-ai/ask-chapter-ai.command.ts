export class AskChapterAICommand {
  constructor(
    public readonly chapterId: string,
    public readonly bookSlug: string,
    public readonly userId: string,
    public readonly question: string,
  ) {}
}
