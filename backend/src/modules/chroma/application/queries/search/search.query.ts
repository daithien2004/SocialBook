import { Query } from '@nestjs/cqrs';
import type { SearchResult } from '@/modules/chroma/domain/repositories/vector.repository.interface';
import type { Actor } from '@/shared/casl/actor';

export class SearchQuery extends Query<{
  query: string;
  results: SearchResult[];
  total: number;
}> {
  constructor(
    public readonly actor: Actor,
    public readonly query: string,
    public readonly contentType?: 'book' | 'author' | 'chapter',
    public readonly filters?: Record<string, unknown>,
    public readonly limit?: number,
    public readonly threshold?: number,
    public readonly embedding?: number[],
  ) {
    super();
  }
}
