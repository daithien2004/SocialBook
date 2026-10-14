import { Query } from '@nestjs/cqrs';

import { PaginatedSearchBookResult } from '@/modules/search/application/dto/search-book-result.dto';

type SearchSortField =
  | 'views'
  | 'likes'
  | 'rating'
  | 'popular'
  | 'createdAt'
  | 'updatedAt'
  | 'title'
  | 'publishedYear'
  | 'score';

function parseSearchSortField(value?: string): SearchSortField {
  switch (value) {
    case 'views':
    case 'likes':
    case 'rating':
    case 'popular':
    case 'createdAt':
    case 'updatedAt':
    case 'title':
    case 'publishedYear':
    case 'score':
      return value;
    case undefined:
    default:
      return 'score';
  }
}

export class IntelligentSearchQuery extends Query<PaginatedSearchBookResult> {
  public readonly query: string;
  public readonly page: number;
  public readonly limit: number;
  public readonly genres?: string[];
  public readonly mode: 'keyword' | 'semantic' | 'hybrid';
  public readonly sortBy: SearchSortField;
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
    super();
    this.query = props.query;
    this.page = props.page ?? 1;
    this.limit = props.limit ?? 10;
    this.genres = props.genres;
    this.mode = props.mode ?? 'hybrid';
    this.order = props.order ?? 'desc';

    this.sortBy = parseSearchSortField(props.sortBy);
  }
}
