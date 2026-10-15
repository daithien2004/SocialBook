import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ReadingPreferencesReadModel } from '@/modules/users/application/read-models/reading-preferences.read-model';

export class GetReadingPreferencesQuery extends Query<ReadingPreferencesReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
  ) {
    super();
  }
}
