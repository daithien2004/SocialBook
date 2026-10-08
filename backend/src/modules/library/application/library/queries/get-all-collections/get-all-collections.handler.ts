import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Collection } from '@/modules/library/domain/library/entities/collection.entity';
import { ICollectionRepository } from '@/modules/library/domain/library/repositories/collection.repository.interface';
import { IReadingListRepository } from '@/modules/library/domain/library/repositories/reading-list.repository.interface';
import { GetAllCollectionsQuery } from './get-all-collections.query';

export interface GetAllCollectionsResult {
  collection: Collection;
  bookCount: number;
}

@QueryHandler(GetAllCollectionsQuery)
export class GetAllCollectionsHandler implements IQueryHandler<
  GetAllCollectionsQuery,
  GetAllCollectionsResult[]
> {
  constructor(
    private readonly collectionRepository: ICollectionRepository,
    private readonly readingListRepository: IReadingListRepository,
  ) {}

  async execute(
    query: GetAllCollectionsQuery,
  ): Promise<GetAllCollectionsResult[]> {
    const collections = await this.collectionRepository.findByUserId(
      query.userId,
    );

    const isOwner = query.viewerId === query.userId;

    const visible = collections.filter((c) => isOwner || c.isPublic);

    const results = await Promise.all(
      visible.map(async (collection) => {
        const bookCount = await this.readingListRepository.countByCollectionId(
          collection.id,
        );

        return {
          collection,
          bookCount,
        };
      }),
    );

    return results;
  }
}
