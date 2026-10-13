import { Query } from '@nestjs/cqrs';

import type { ReadingRoomResult } from '@/modules/reading-rooms/application/reading-room.result';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';

export class GetMyActiveRoomsQuery extends Query<
  PageResult<ReadingRoomResult>
> {
  constructor(
    public readonly userId: string,
    public readonly pagination: PageParams,
  ) {
    super();
  }
}
