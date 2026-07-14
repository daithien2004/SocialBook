export class DeleteRoomCommand {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
  ) {}
}
