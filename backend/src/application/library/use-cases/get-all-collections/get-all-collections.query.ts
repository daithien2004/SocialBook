export class GetAllCollectionsQuery {
  constructor(
    public readonly userId: string,
    public readonly viewerId?: string,
  ) {}
}
