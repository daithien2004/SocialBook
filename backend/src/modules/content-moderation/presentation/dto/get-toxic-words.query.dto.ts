import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { GetToxicWordsQuery } from '@/modules/content-moderation/application/queries/get-toxic-words/get-toxic-words.query';

export class GetToxicWordsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by toxic word or group' })
  @IsOptional()
  @IsString()
  search?: string;

  toQuery(actor: Actor): GetToxicWordsQuery {
    return new GetToxicWordsQuery(
      actor,
      this.effectiveOffset,
      this.actualLimit,
      this.search,
    );
  }
}
