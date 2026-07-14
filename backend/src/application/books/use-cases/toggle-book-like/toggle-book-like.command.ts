export class ToggleBookLikeCommand {
  public readonly bookId: string;
  public readonly userId: string;
  public readonly bookSlug: string;

  constructor(props: { bookId: string; userId: string; bookSlug: string }) {
    this.bookId = props.bookId;
    this.userId = props.userId;
    this.bookSlug = props.bookSlug;
  }
}
