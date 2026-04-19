export class StartChaptersImportCommand {
  constructor(
    public readonly bookId: string,
    public readonly chapters: Array<{ title: string; content: string }>,
  ) {}
}
