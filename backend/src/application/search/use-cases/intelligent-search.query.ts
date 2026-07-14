export class IntelligentSearchQuery {
  public readonly query: string;
  public readonly page: number;
  public readonly limit: number;
  public readonly genres?: string[];
  public readonly mode: 'keyword' | 'semantic' | 'hybrid';
  public readonly sortBy:
    | 'views'
    | 'likes'
    | 'rating'
    | 'popular'
    | 'createdAt'
    | 'updatedAt'
    | 'title'
    | 'publishedYear'
    | 'score';
  public readonly order: 'asc' | 'desc';

  constructor(props: {
    query: string;
    page?: number;
    limit?: number;
    genres?: string[];
    mode?: 'keyword' | 'semantic' | 'hybrid';
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) {
    this.query = props.query;
    this.page = props.page ?? 1;
    this.limit = props.limit ?? 10;
    this.genres = props.genres;
    this.mode = props.mode ?? 'hybrid';
    this.order = props.order ?? 'desc';

    // Type-safe adaptation for search-specific sortBy
    const validSearchSortFields = [
      'views',
      'likes',
      'rating',
      'popular',
      'createdAt',
      'updatedAt',
      'title',
      'publishedYear',
      'score',
    ];

    this.sortBy =
      props.sortBy && validSearchSortFields.includes(props.sortBy)
        ? (props.sortBy as
            | 'views'
            | 'likes'
            | 'rating'
            | 'popular'
            | 'createdAt'
            | 'updatedAt'
            | 'title'
            | 'publishedYear'
            | 'score')
        : 'score';
  }
}
