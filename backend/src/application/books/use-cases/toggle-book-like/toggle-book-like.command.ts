export class ToggleBookLikeCommand {
  public readonly bookId: string;
  public readonly userId: string;

  constructor(props: { bookId: string; userId: string }) {
    this.bookId = props.bookId;
    this.userId = props.userId;
  }
}
