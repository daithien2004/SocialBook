export class GetPostQuery {
  constructor(
    public readonly postId: string,
    public readonly viewerUserId?: string,
  ) {}
}
