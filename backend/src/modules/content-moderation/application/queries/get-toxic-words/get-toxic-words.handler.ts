import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ForbiddenError } from '@casl/ability';
import { ToxicWordReadRepository } from '@/modules/content-moderation/application/ports/toxic-word-read.repository';
import type { ToxicWordReadModel } from '@/modules/content-moderation/application/read-models/toxic-word.read-model';
import type { PageResult } from '@/shared/domain/pagination.types';
import { GetToxicWordsQuery } from './get-toxic-words.query';

@QueryHandler(GetToxicWordsQuery)
export class GetToxicWordsHandler implements IQueryHandler<GetToxicWordsQuery> {
  constructor(
    private readonly toxicWordReadRepository: ToxicWordReadRepository,
  ) {}

  async execute(
    query: GetToxicWordsQuery,
  ): Promise<PageResult<ToxicWordReadModel>> {
    ForbiddenError.from(query.actor.ability).throwUnlessCan(
      'read',
      'ToxicWord',
    );
    return this.toxicWordReadRepository.findPage(
      query.actor.ability,
      query.search,
      { offset: query.offset, limit: query.limit },
    );
  }
}
