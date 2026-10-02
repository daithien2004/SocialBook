export class GetRoomByCodeQuery {
  constructor(
    public readonly code: string,
    public readonly userId?: string,
  ) {}
}
