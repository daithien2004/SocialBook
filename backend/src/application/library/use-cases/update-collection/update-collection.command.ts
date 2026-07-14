export class UpdateCollectionCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly isPublic?: boolean,
  ) {}
}
