export class DeleteCommentCommand {
  constructor(
    public readonly userId: string,
    public readonly commentId: string,
    public readonly roomId: string,
    public readonly paragraphId: string,
  ) {}
}
