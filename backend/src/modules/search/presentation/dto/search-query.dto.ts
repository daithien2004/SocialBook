import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IntelligentSearchQuery } from '@/modules/search/application/queries/intelligent-search/intelligent-search.query';
import type { Actor } from '@/shared/casl/actor';

export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  toQuery(actor: Actor): IntelligentSearchQuery {
    return new IntelligentSearchQuery({
      actor,
      query: this.query,
      limit: this.limit,
    });
  }
}
