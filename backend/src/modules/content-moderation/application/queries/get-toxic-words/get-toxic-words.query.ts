import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { ToxicWordReadModel } from '@/modules/content-moderation/application/read-models/toxic-word.read-model';

export class GetToxicWordsQuery extends Query<PageResult<ToxicWordReadModel>> {
  constructor(
    public readonly actor: Actor,
    public readonly offset: number,
    public readonly limit: number,
    public readonly search?: string,
  ) {
    super();
  }
}
