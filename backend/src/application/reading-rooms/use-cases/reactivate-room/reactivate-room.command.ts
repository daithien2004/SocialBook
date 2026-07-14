export class ReactivateRoomCommand {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
  ) {}
}
