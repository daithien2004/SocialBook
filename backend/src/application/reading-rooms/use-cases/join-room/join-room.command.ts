export class JoinRoomCommand {
  constructor(
    public readonly userId: string,
    public readonly roomCode: string,
  ) {}
}
