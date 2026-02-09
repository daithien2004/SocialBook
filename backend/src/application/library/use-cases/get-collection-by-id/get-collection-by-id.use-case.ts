import { GetCollectionByIdQuery } from './get-collection-by-id.query';

// TODO: Create Collection entity in domain layer when implementing this feature
export interface CollectionWithBooks {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    userId: string;
    books: Array<{
        id: string;
        title: string;
        coverUrl: string;
        authorId: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

export class GetCollectionByIdUseCase {
    async execute(query: GetCollectionByIdQuery): Promise<CollectionWithBooks | null> {
        // TODO: Implement get collection by id logic
        // 1. Find collection by id
        // 2. Check user permissions
        // 3. Include associated books
        // 4. Return collection or null if not found

        return null;
    }
}
