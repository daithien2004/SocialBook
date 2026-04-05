export class GetFollowersQuery {
  constructor(
    public readonly targetId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
