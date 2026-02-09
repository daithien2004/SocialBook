import { Injectable } from '@nestjs/common';
import { GetAllCollectionsQuery } from './get-all-collections.query';

export interface CollectionWithBookCount {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    userId: string;
    bookCount: number;
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class GetAllCollectionsUseCase {
    async execute(query: GetAllCollectionsQuery): Promise<CollectionWithBookCount[]> {
        // TODO: Implement get all collections logic
        // 1. Query collections from repository
        // 2. Filter by userId if provided
        // 3. Include book count for each collection
        // 4. Return collections

        return [];
    }
}
