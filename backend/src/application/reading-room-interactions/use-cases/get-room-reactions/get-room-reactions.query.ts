export class GetRoomReactionsQuery {
  constructor(
    public readonly roomId: string,
    public readonly chapterSlug?: string,
  ) {}
}
