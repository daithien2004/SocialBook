import { UserId } from '@/domain/users/value-objects/user-id.vo';

export interface GetAllCollectionsRequest {
    userId?: string;
}

export interface GetAllCollectionsResponse {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    userId: string;
    bookCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export class GetAllCollectionsUseCase {
    async execute(request: GetAllCollectionsRequest): Promise<GetAllCollectionsResponse[]> {
        // TODO: Implement get all collections logic
        // This would involve:
        // 1. Query collections from repository
        // 2. Filter by userId if provided
        // 3. Include book count for each collection
        // 4. Return response
        
        // Placeholder implementation
        return [];
    }
}


