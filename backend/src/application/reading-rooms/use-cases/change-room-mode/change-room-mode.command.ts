export class ChangeRoomModeCommand {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
    public readonly mode: string,
  ) {}
}
