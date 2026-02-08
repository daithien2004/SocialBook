import { UserId } from '@/domain/library/value-objects/user-id.vo';

export interface CreateCollectionRequest {
    userId: string;
    name: string;
    description?: string;
    isPublic?: boolean;
}

export interface CreateCollectionResponse {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export class CreateCollectionUseCase {
    async execute(request: CreateCollectionRequest): Promise<CreateCollectionResponse> {
        const userId = UserId.create(request.userId);
        
        // TODO: Implement collection creation logic
        // This would involve:
        // 1. Create collection entity
        // 2. Save to repository
        // 3. Return response
        
        // Placeholder implementation
        const now = new Date();
        return {
            id: crypto.randomUUID(),
            name: request.name,
            description: request.description || null,
            isPublic: request.isPublic || false,
            userId: request.userId,
            createdAt: now,
            updatedAt: now,
        };
    }
}


