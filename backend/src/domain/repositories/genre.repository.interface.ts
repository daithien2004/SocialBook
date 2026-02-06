import { Genre } from '../entities/genre.entity';
import { IGenericRepository } from './generic.repository.interface';

export abstract class IGenreRepository extends IGenericRepository<Genre> {
    abstract findAll(query: Record<string, unknown>, current: number, pageSize: number): Promise<{ data: Genre[], meta: any }>;
    abstract findAllSimple(): Promise<Genre[]>;
    abstract existsByName(name: string, excludeId?: string): Promise<boolean>;
}
