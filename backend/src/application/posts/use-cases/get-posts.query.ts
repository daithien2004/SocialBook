export class GetPostsQuery {
  constructor(
    public readonly limit: number = 10,
    public readonly cursor?: string,
    public readonly viewerUserId?: string,
  ) {}
}
