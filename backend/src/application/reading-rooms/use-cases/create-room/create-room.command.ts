export class CreateRoomCommand {
  constructor(
    public readonly hostId: string,
    public readonly bookId: string,
    public readonly currentChapterSlug: string,
    public readonly mode: 'sync' | 'free',
    public readonly maxMembers?: number,
  ) {}
}
