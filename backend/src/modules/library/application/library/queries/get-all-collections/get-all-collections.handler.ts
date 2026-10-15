import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CollectionReadRepository } from '@/modules/library/application/ports/collection-read.repository';
import type { CollectionReadModel } from '@/modules/library/application/read-models/collection.read-model';
import type { PageResult } from '@/shared/domain/pagination.types';
import { GetAllCollectionsQuery } from './get-all-collections.query';

@QueryHandler(GetAllCollectionsQuery)
export class GetAllCollectionsHandler implements IQueryHandler<
  GetAllCollectionsQuery,
  PageResult<CollectionReadModel>
> {
  constructor(
    private readonly collectionReadRepository: CollectionReadRepository,
  ) {}

  execute(
    query: GetAllCollectionsQuery,
  ): Promise<PageResult<CollectionReadModel>> {
    return this.collectionReadRepository.findPage(
      query.actor.ability,
      query.userId,
      query.page,
    );
  }
}
