export class GetTopReadBooksQuery {
  constructor(
    public readonly timeRange: 'weekly' | 'monthly' | 'all',
    public readonly limit: number = 5,
  ) {}
}
