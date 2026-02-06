export abstract class IGenericRepository<T> {
    abstract findMany(options: {
        filter?: any;
        page?: number;
        limit?: number;
        sort?: any;
        populate?: string | string[];
    }): Promise<{ data: T[]; meta: { current: number; pageSize: number; total: number; totalPages: number } }>;

    abstract findById(id: string | any, populate?: string | string[]): Promise<T | null>;

    abstract findOne(filter: any, populate?: string | string[]): Promise<T | null>;

    abstract create(data: Partial<T>): Promise<T>;

    abstract update(id: string | any, data: any): Promise<T>;

    abstract delete(id: string | any): Promise<void>;

    abstract count(filter?: any): Promise<number>;
}
