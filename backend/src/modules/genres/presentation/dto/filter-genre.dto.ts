import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { IsOptional, IsString } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { GetGenresQuery } from '../../application/queries/get-genres/get-genres.query';

export class FilterGenreDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  toQuery(actor: Actor): GetGenresQuery {
    return new GetGenresQuery(
      actor,
      { name: this.name },
      { offset: this.effectiveOffset, limit: this.actualLimit },
    );
  }
}
