export class LeaveRoomCommand {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
  ) {}
}
