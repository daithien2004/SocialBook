import { Query } from '@nestjs/cqrs';
import { ReadingPreferences } from '@/modules/users/domain/users/value-objects/reading-preferences.vo';

export class GetReadingPreferencesQuery extends Query<ReadingPreferences> {
  constructor(public readonly userId: string) {
    super();
  }
}
