import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { GetRoomByCodeReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';

export class GetRoomByCodeQuery extends Query<GetRoomByCodeReadModel> {
  constructor(
    public readonly code: string,
    public readonly actor: Actor,
  ) {
    super();
  }
}
