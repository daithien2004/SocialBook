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

  toQuery(): IntelligentSearchQuery {
    return new IntelligentSearchQuery({
      query: this.query,
      limit: this.limit,
    });
  }
}
