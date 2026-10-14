import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ReadingRoomReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';

export class GetMyHistoryQuery extends Query<PageResult<ReadingRoomReadModel>> {
  constructor(
    public readonly actor: Actor,
    public readonly pagination: PageParams,
  ) {
    super();
  }
}
