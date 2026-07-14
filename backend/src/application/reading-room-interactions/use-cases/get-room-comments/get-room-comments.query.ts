export class GetRoomCommentsQuery {
  constructor(
    public readonly roomId: string,
    public readonly chapterSlug?: string,
  ) {}
}
