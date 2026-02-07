import { PaginatedResult } from '@/src/common/interfaces/pagination.interface';
import { Genre } from '../entities/genre.entity';
import { GenreId } from '../value-objects/genre-id.vo';
import { GenreName } from '../value-objects/genre-name.vo';

export interface GenreFilter {
    name?: string;
    isActive?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export abstract class IGenreRepository {
    abstract findById(id: GenreId): Promise<Genre | null>;
    abstract findByName(name: GenreName): Promise<Genre | null>;
    abstract findBySlugs(slugs: string[]): Promise<Genre[]>;
    abstract findAll(
        filter: GenreFilter,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<Genre>>;
    abstract findAllSimple(): Promise<Genre[]>;
    
    abstract save(genre: Genre): Promise<void>;
    abstract delete(id: GenreId): Promise<void>;
    
    abstract existsByName(name: GenreName, excludeId?: GenreId): Promise<boolean>;
    abstract countActive(): Promise<number>;
}