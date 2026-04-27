export class GetBooksQuery {
  public readonly page: number;
  public readonly limit: number;
  public readonly title?: string;
  public readonly authorId?: string;
  public readonly genres?: string[];
  public readonly tags?: string[];
  public readonly status?: 'draft' | 'published' | 'completed';
  public readonly search?: string;
  public readonly publishedYear?: string;
  public readonly sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'title'
    | 'views'
    | 'likes'
    | 'publishedYear';
  public readonly order?: 'asc' | 'desc';

  constructor(props: {
    page?: number;
    limit?: number;
    title?: string;
    authorId?: string;
    genres?: string[];
    tags?: string[];
    status?: 'draft' | 'published' | 'completed';
    search?: string;
    publishedYear?: string;
    sortBy?: string; // Accept string for adaptation
    order?: 'asc' | 'desc';
  }) {
    this.page = props.page ?? 1;
    this.limit = props.limit ?? 10;
    this.title = props.title;
    this.authorId = props.authorId;
    this.genres = props.genres;
    this.tags = props.tags;
    this.status = props.status;
    this.search = props.search;
    this.publishedYear = props.publishedYear;
    
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'title',
      'views',
      'likes',
      'publishedYear',
    ];
    this.sortBy = (
      props.sortBy && validSortFields.includes(props.sortBy)
        ? props.sortBy
        : 'createdAt'
    ) as any;
    
    this.order = props.order ?? 'desc';
  }
}
