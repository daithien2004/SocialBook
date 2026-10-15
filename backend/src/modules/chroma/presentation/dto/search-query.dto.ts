import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { SearchQuery } from '@/modules/chroma/application/queries/search/search.query';

export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsOptional()
  @IsEnum(['book', 'author', 'chapter'])
  contentType?: 'book' | 'author' | 'chapter';

  @IsOptional()
  filters?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  threshold?: number;

  @IsOptional()
  @IsArray()
  embedding?: number[];

  toQuery(actor: Actor): SearchQuery {
    return new SearchQuery(
      actor,
      this.query,
      this.contentType,
      this.filters,
      this.limit,
      this.threshold,
      this.embedding,
    );
  }
}
