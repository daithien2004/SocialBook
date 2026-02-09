import { CreateCollectionCommand } from './create-collection.command';

export interface CollectionResult {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export class CreateCollectionUseCase {
    async execute(command: CreateCollectionCommand): Promise<CollectionResult> {


        const now = new Date();
        return {
            id: crypto.randomUUID(),
            name: command.name,
            description: command.description || null,
            isPublic: command.isPublic || false,
            userId: command.userId,
            createdAt: now,
            updatedAt: now,
        };
    }
}
