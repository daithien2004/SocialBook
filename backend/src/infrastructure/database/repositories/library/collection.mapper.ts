import { Collection } from '@/domain/library/entities/collection.entity';
import { Types } from 'mongoose';

export interface CollectionPersistence {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    name: string;
    description: string;
    isPublic: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export class CollectionMapper {
    static toDomain(doc: any): Collection {
        return Collection.reconstitute({
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            name: doc.name,
            description: doc.description || '',
            isPublic: doc.isPublic || false,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }

    static toPersistence(entity: Collection): CollectionPersistence {
        return {
            _id: new Types.ObjectId(entity.id),
            userId: new Types.ObjectId(entity.userId.toString()),
            name: entity.name,
            description: entity.description,
            isPublic: entity.isPublic,
            updatedAt: entity.updatedAt,
        };
    }
}
