export class ToggleBookLikeCommand {
  constructor(
    public readonly bookId: string,
    public readonly userId: string,
  ) {}
}
