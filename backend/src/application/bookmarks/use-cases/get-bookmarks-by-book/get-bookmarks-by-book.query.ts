export class GetBookmarksByBookQuery {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
  ) {}
}
