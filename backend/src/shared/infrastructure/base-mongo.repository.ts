import {
  CursorPaginatedResult,
  PaginatedResult,
  PaginationMeta,
  PaginationOptions,
  SortOptions,
} from '@/common/interfaces/pagination.interface';
import { Entity } from '@/shared/domain/entity.base';
import { Identifier } from '@/shared/domain/identifier.base';
import { Document, FilterQuery, Model, PipelineStage } from 'mongoose';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export abstract class BaseMongoRepository<
  TEntity extends Entity<any>,
  TDocument extends Document,
  TId extends Identifier,
> {
  constructor(protected readonly model: Model<TDocument>) {}

  protected abstract toDomain(doc: TDocument): TEntity;
  protected abstract toPersistence(entity: TEntity): any;

  protected async baseSave(entity: TEntity): Promise<void> {
    const persistenceData = this.toPersistence(entity);
    const id = entity.id.toString();

    await this.model
      .findByIdAndUpdate(
        id,
        { $set: persistenceData },
        { upsert: true, new: true },
      )
      .exec();
  }

  protected async baseDelete(id: TId): Promise<void> {
    await this.model.findByIdAndDelete(id.toString()).exec();
  }

  protected async baseSoftDelete(id: TId): Promise<void> {
    await this.model
      .findByIdAndUpdate(id.toString(), {
        $set: { isDeleted: true, updatedAt: new Date() },
      })
      .exec();
  }

  private normalizePagination(pagination?: PaginationOptions) {
    const page = Math.max(1, pagination?.page || DEFAULT_PAGE);
    const limit = Math.min(pagination?.limit || DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  protected async executePaginatedQuery<R = TEntity>(
    filter: FilterQuery<TDocument>,
    pagination?: PaginationOptions,
    sort?: SortOptions,
    mapFn?: (doc: any) => R,
    populateArgs?: any[],
    pipelineStages?: {
      preFacet?: PipelineStage[];
      postFacet?: PipelineStage[];
    },
  ): Promise<PaginatedResult<R>> {
    const { page, limit, skip } = this.normalizePagination(pagination);

    const sortStage: Record<string, 1 | -1> = sort?.sortBy
      ? { [sort.sortBy]: sort.order === 'desc' ? -1 : 1 }
      : { createdAt: -1 };

    const aggregatePipeline: PipelineStage[] = [
      { $match: filter },
      ...(pipelineStages?.preFacet || []),
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limit },
            ...(pipelineStages?.postFacet || []),
          ] as any[],
        },
      },
    ];

    const [result] = await this.model.aggregate(aggregatePipeline).exec();

    const total: number = result.metadata[0]?.total ?? 0;
    let documents: any[] = result.data;

    if (populateArgs && documents.length > 0) {
      documents = await this.model.populate(documents, populateArgs);
    }

    const data = mapFn
      ? documents.map((doc) => mapFn(doc))
      : (documents.map((doc) => this.toDomain(doc)) as unknown as R[]);

    return {
      data,
      meta: this.buildMeta(page, limit, total),
    };
  }

  protected async executeCursorQuery<R = TEntity>(
    filter: FilterQuery<TDocument>,
    limit: number = DEFAULT_LIMIT,
    sort: Record<string, 1 | -1> = { _id: -1 },
    mapFn?: (doc: any) => R,
    populateArgs?: any[],
    pipelineStages?: PipelineStage[],
  ): Promise<CursorPaginatedResult<R>> {
    const aggregatePipeline: PipelineStage[] = [
      { $match: filter },
      ...(pipelineStages || []),
      { $sort: sort },
      { $limit: limit + 1 },
    ];

    let docs = await this.model.aggregate(aggregatePipeline).exec();
    const hasMore = docs.length > limit;

    if (hasMore) {
      docs.pop();
    }

    if (populateArgs && docs.length > 0) {
      docs = await this.model.populate(docs, populateArgs);
    }

    const data = mapFn
      ? docs.map((doc) => mapFn(doc))
      : (docs.map((doc) => this.toDomain(doc)) as unknown as R[]);

    const nextCursor =
      hasMore && docs.length > 0 ? docs[docs.length - 1]._id.toString() : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  protected buildMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    return {
      current: page,
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
