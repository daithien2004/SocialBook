import type { Actor } from '@/shared/casl/actor';
import { GetMyHistoryQuery } from '@/modules/reading-rooms/application/queries/get-my-history/get-my-history.query';
import { OffsetPaginationQueryDto } from '@/shared/platform/dto/offset-pagination-query.dto';

export class GetMyHistoryRequestDto extends OffsetPaginationQueryDto {
  toQuery(actor: Actor): GetMyHistoryQuery {
    return new GetMyHistoryQuery(actor, {
      offset: this.effectiveOffset,
      limit: this.actualLimit,
    });
  }
}
