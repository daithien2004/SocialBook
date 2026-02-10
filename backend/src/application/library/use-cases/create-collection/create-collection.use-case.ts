import { Collection } from '@/domain/library/entities/collection.entity';
import { ICollectionRepository } from '@/domain/library/repositories/collection.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Injectable } from '@nestjs/common';
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

@Injectable()
export class CreateCollectionUseCase {
    constructor(
        private readonly collectionRepository: ICollectionRepository,
        private readonly idGenerator: IIdGenerator
    ) { }

    async execute(command: CreateCollectionCommand): Promise<Collection> {
        const collection = Collection.create({
            id: this.idGenerator.generate(),
            userId: command.userId,
            name: command.name,
            description: command.description || '',
            isPublic: command.isPublic || false
        });

        await this.collectionRepository.save(collection);

        return collection;
    }
}
