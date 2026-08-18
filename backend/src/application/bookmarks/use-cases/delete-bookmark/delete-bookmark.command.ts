export class DeleteBookmarkCommand {
  constructor(
    public readonly userId: string,
    public readonly paragraphId: string,
  ) {}
}
