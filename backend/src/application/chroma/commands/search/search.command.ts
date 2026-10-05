import { Command } from '@nestjs/cqrs';
import { SearchResult } from '@/domain/chroma/repositories/vector.repository.interface';

export class SearchCommand extends Command<{
  query: string;
  results: SearchResult[];
  total: number;
}> {
  constructor(
    public readonly query: string,
    public readonly contentType?: string,
    public readonly filters?: Record<string, any>,
    public readonly limit?: number,
    public readonly threshold?: number,
    public readonly embedding?: number[],
  ) {
    super();
  }
}
