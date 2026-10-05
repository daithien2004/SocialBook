import { Query } from '@nestjs/cqrs';
import { Collection } from "@/domain/library/entities/collection.entity";
import { ICollectionRepository } from "@/domain/library/repositories/collection.repository.interface";
import { IReadingListRepository } from "@/domain/library/repositories/reading-list.repository.interface";

import { GetAllCollectionsResult } from '@/application/library/queries/get-all-collections/get-all-collections.handler';

export class GetAllCollectionsQuery extends Query<GetAllCollectionsResult[]> {
  constructor(
    public readonly userId: string,
    public readonly viewerId?: string,
  ) { super(); }
}
