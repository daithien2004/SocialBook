import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { GetFlaggedPostsQuery } from '@/modules/posts/application/posts/queries/get-flagged-posts/get-flagged-posts.query';
import type { Actor } from '@/shared/casl/actor';
import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';

export class FlaggedPostsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'violations'])
  declare sortBy?: 'newest' | 'oldest' | 'violations';

  toQuery(actor: Actor): GetFlaggedPostsQuery {
    return new GetFlaggedPostsQuery(
      actor,
      this.actualPage,
      this.actualLimit,
      this.reason,
      this.startDate ? new Date(this.startDate) : undefined,
      this.endDate ? new Date(this.endDate) : undefined,
      this.sortBy,
    );
  }
}
