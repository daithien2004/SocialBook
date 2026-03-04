import { PaginatedResult, PaginationMeta, PaginationOptions, SortOptions } from '@/common/interfaces/pagination.interface';
import { Entity } from '@/shared/domain/entity.base';
import { Identifier } from '@/shared/domain/identifier.base';
import { Document, FilterQuery, Model, Query } from 'mongoose';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export abstract class BaseMongoRepository<
    TEntity extends Entity<any>,
    TDocument extends Document,
    TId extends Identifier
> {
    constructor(protected readonly model: Model<TDocument>) { }

    protected abstract toDomain(doc: TDocument): TEntity;
    protected abstract toPersistence(entity: TEntity): any;

    protected async baseSave(entity: TEntity): Promise<void> {
        const persistenceData = this.toPersistence(entity);
        const id = entity.id.toString();

        await this.model.findByIdAndUpdate(
            id,
            { $set: persistenceData },
            { upsert: true, new: true }
        ).exec();
    }

    protected async baseDelete(id: TId): Promise<void> {
        await this.model.findByIdAndDelete(id.toString()).exec();
    }

    protected async baseSoftDelete(id: TId): Promise<void> {
        await this.model.findByIdAndUpdate(
            id.toString(),
            { $set: { isDeleted: true, updatedAt: new Date() } }
        ).exec();
    }

    private normalizePagination(pagination?: PaginationOptions) {
        const page = Math.max(1, pagination?.page || DEFAULT_PAGE);
        const limit = Math.min(pagination?.limit || DEFAULT_LIMIT, MAX_LIMIT);
        const skip = (page - 1) * limit;
        return { page, limit, skip };
    }

    private applySort(
        query: Query<TDocument[], TDocument>,
        sort?: SortOptions
    ): Query<TDocument[], TDocument> {
        if (sort?.sortBy) {
            return query.sort({ [sort.sortBy]: sort.order === 'desc' ? -1 : 1 });
        }
        return query.sort({ createdAt: -1 }); // default sort
    }

    protected async executePaginatedQuery<R = TEntity>(
        filter: FilterQuery<TDocument>,
        pagination?: PaginationOptions,
        sort?: SortOptions,
        mapFn?: (doc: any) => R,
        populateArgs?: any[]
    ): Promise<PaginatedResult<R>> {
        const { page, limit, skip } = this.normalizePagination(pagination);

        let query = this.model.find(filter);
        if (populateArgs) {
            populateArgs.forEach(p => { query = query.populate(p); });
        }

        const [documents, total] = await Promise.all([
            this.applySort(query, sort)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.model.countDocuments(filter).exec(),
        ]);

        const mapper = mapFn || ((doc: any) => this.toDomain(doc) as unknown as R);

        return {
            data: documents.map(doc => mapper(doc)),
            meta: this.buildMeta(page, limit, total),
        };
    }

    protected buildMeta(page: number, limit: number, total: number): PaginationMeta {
        return {
            current: page,
            pageSize: limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }
}
