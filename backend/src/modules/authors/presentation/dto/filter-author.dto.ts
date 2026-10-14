import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { IsOptional, IsString } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { ListAuthorsQuery } from '../../application/queries/list-authors/list-authors.query';

export class FilterAuthorDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  toQuery(actor: Actor, limit = this.actualLimit): ListAuthorsQuery {
    return new ListAuthorsQuery(
      actor,
      { name: this.name, bio: this.bio },
      { offset: (this.actualPage - 1) * limit, limit },
    );
  }
}
