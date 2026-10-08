import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Collection } from '@/modules/library/domain/library/entities/collection.entity';
import { LibraryItemReadModel } from '@/modules/library/domain/library/read-models/library-item.read-model';
import { ICollectionRepository } from '@/modules/library/domain/library/repositories/collection.repository.interface';
import { IReadingListRepository } from '@/modules/library/domain/library/repositories/reading-list.repository.interface';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { GetCollectionByIdQuery } from './get-collection-by-id.query';

export interface GetCollectionByIdResult {
  collection: Collection;
  books: LibraryItemReadModel[];
}

@QueryHandler(GetCollectionByIdQuery)
export class GetCollectionByIdHandler implements IQueryHandler<
  GetCollectionByIdQuery,
  GetCollectionByIdResult | null
> {
  constructor(
    private readonly collectionRepository: ICollectionRepository,
    private readonly readingListRepository: IReadingListRepository,
  ) {}

  async execute(
    query: GetCollectionByIdQuery,
  ): Promise<GetCollectionByIdResult | null> {
    const collection = await this.collectionRepository.findById(
      query.collectionId,
    );

    if (!collection) {
      return null;
    }

    if (!collection.isPublic && collection.userId.toString() !== query.userId) {
      throw new ForbiddenDomainException(
        'You do not have permission to view this collection',
      );
    }

    const books = await this.readingListRepository.findByCollectionId(
      collection.id,
    );

    return {
      collection,
      books,
    };
  }
}
