import { Query } from '@nestjs/cqrs';
import { Collection } from "@/domain/library/entities/collection.entity";
import { LibraryItemReadModel } from "@/domain/library/read-models/library-item.read-model";
import { ICollectionRepository } from "@/domain/library/repositories/collection.repository.interface";
import { IReadingListRepository } from "@/domain/library/repositories/reading-list.repository.interface";
import { ForbiddenDomainException } from "@/shared/domain/common-exceptions";

import { GetCollectionByIdResult } from '@/application/library/queries/get-collection-by-id/get-collection-by-id.handler';

export class GetCollectionByIdQuery extends Query<GetCollectionByIdResult | null> {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
  ) { super(); }
}
