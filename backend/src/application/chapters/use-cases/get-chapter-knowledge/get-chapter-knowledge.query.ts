export class GetChapterKnowledgeQuery {
  constructor(
    public readonly chapterId: string,
    public readonly force: boolean = false,
  ) {}
}
