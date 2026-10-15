import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Collection } from '@/modules/library/domain/library/entities/collection.entity';
import type { LibraryItemReadModel } from '@/modules/library/application/read-models/library-item.read-model';
import { ICollectionRepository } from '@/modules/library/domain/library/repositories/collection.repository.interface';
import { LibraryReadRepository } from '@/modules/library/application/ports/library-read.repository';
import { GetCollectionByIdQuery } from './get-collection-by-id.query';
import { subject } from '@casl/ability';

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
    private readonly libraryReadRepository: LibraryReadRepository,
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

    if (
      !query.actor.ability.can(
        'read',
        subject('LibraryCollection', {
          id: collection.id,
          userId: collection.userId.toString(),
          isPublic: collection.isPublic,
        }),
      )
    ) {
      return null;
    }

    const books = await this.libraryReadRepository.findByCollectionId(
      collection.id,
    );

    return {
      collection,
      books,
    };
  }
}
