import { PaginatedResult } from '@/src/common/interfaces/pagination.interface';
import { Author } from '../entities/author.entity';
import { AuthorId } from '../value-objects/author-id.vo';
import { AuthorName } from '../value-objects/author-name.vo';

export interface AuthorFilter {
    name?: string;
    bio?: string;
    isActive?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export abstract class IAuthorRepository {
    abstract findById(id: AuthorId): Promise<Author | null>;
    abstract findByName(name: AuthorName): Promise<Author | null>;
    abstract findAll(
        filter: AuthorFilter,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<Author>>;
    abstract findAllSimple(): Promise<Author[]>;
    
    abstract save(author: Author): Promise<void>;
    abstract delete(id: AuthorId): Promise<void>;
    
    abstract existsByName(name: AuthorName, excludeId?: AuthorId): Promise<boolean>;
    abstract countActive(): Promise<number>;
    abstract searchByName(query: string, limit?: number): Promise<Author[]>;
}
