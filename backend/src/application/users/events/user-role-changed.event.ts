export class UserRoleChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly newRoleId: string,
  ) {}
}
