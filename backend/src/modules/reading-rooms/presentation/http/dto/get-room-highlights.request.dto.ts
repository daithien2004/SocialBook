import type { Actor } from '@/shared/casl/actor';
import { GetRoomHighlightsQuery } from '@/modules/reading-rooms/application/queries/get-room-highlights/get-room-highlights.query';
import { OffsetPaginationQueryDto } from '@/shared/platform/dto/offset-pagination-query.dto';

export class GetRoomHighlightsRequestDto extends OffsetPaginationQueryDto {
  toQuery(actor: Actor, code: string): GetRoomHighlightsQuery {
    return new GetRoomHighlightsQuery(
      code,
      actor,
      this.effectiveOffset,
      this.actualLimit,
    );
  }
}
