import type { Actor } from '@/shared/casl/actor';
import { OffsetPaginationQueryDto } from '@/shared/platform/dto/offset-pagination-query.dto';
import { GetMyActiveRoomsQuery } from '@/modules/reading-rooms/application/queries/get-my-active-rooms/get-my-active-rooms.query';

export class GetMyActiveRoomsRequestDto extends OffsetPaginationQueryDto {
  toQuery(actor: Actor): GetMyActiveRoomsQuery {
    return new GetMyActiveRoomsQuery(actor, {
      offset: this.effectiveOffset,
      limit: this.actualLimit,
    });
  }
}
