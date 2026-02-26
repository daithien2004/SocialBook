import { Collection } from '../entities/collection.entity';

export abstract class ICollectionRepository {
    abstract save(collection: Collection): Promise<void>;
    abstract findById(id: string): Promise<Collection | null>;
    abstract findByUserId(userId: string): Promise<Collection[]>;
    abstract findByUserIdAndName(userId: string, name: string): Promise<Collection | null>;
    abstract findByIds(ids: string[]): Promise<Collection[]>;
    abstract delete(id: string): Promise<void>;
}
