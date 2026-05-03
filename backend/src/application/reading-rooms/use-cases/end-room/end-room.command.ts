export class EndRoomCommand {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
  ) {}
}
