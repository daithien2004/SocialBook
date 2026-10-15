import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { GetAllCollectionsQuery } from '@/modules/library/application/library/queries/get-all-collections/get-all-collections.query';
import type { Actor } from '@/shared/casl/actor';
import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';

export class GetCollectionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  toQuery(actor: Actor): GetAllCollectionsQuery {
    return new GetAllCollectionsQuery(actor, this.userId, {
      offset: this.effectiveOffset,
      limit: this.actualLimit,
    });
  }
}
