import {
  CursorPaginatedResult,
  PaginatedResult,
  PaginationMeta,
  PaginationOptions,
  SortOptions,
} from '@/common/interfaces/pagination.interface';
import { Entity } from '@/shared/domain/entity.base';
import { Identifier } from '@/shared/domain/identifier.base';
import {
  Document,
  FilterQuery,
  Model,
  PipelineStage,
  PopulateOptions,
  UpdateQuery,
} from 'mongoose';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 10000;

interface AggregateFacetResult<TData> {
  metadata: { total: number }[];
  data: TData[];
}

export abstract class BaseMongoRepository<
  TEntity extends Entity<Identifier>,
  TDocument extends Document,
  TId extends Identifier,
  TPersistence = object,
> {
  constructor(protected readonly model: Model<TDocument>) {}

  protected abstract toDomain(doc: TDocument): TEntity;
  protected abstract toPersistence(entity: TEntity): TPersistence;

  protected async baseSave(entity: TEntity): Promise<void> {
    const persistenceData = this.toPersistence(entity);
    const id = entity.id.toString();

    await this.model
      .findByIdAndUpdate(
        id,
        { $set: persistenceData } as unknown as UpdateQuery<TDocument>,
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

  protected async executePaginatedQuery<
    R = TEntity,
    TDoc = Record<string, unknown>,
  >(
    filter: FilterQuery<TDocument>,
    pagination?: PaginationOptions,
    sort?: SortOptions,
    mapFn?: (doc: TDoc) => R,
    populateArgs?: PopulateOptions | PopulateOptions[] | string | string[],
    pipelineStages?: {
      preFacet?: PipelineStage[];
      postFacet?: PipelineStage[];
    },
  ): Promise<PaginatedResult<R>> {
    const { page, limit, skip } = this.normalizePagination(pagination);

    const sortStage: Record<string, 1 | -1> = sort?.sortBy
      ? { [sort.sortBy]: sort.order === 'desc' ? -1 : 1 }
      : { createdAt: -1 };

    const dataStages: PipelineStage[] = [
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
      ...(pipelineStages?.postFacet || []),
    ];

    const aggregatePipeline: PipelineStage[] = [
      { $match: filter },
      ...(pipelineStages?.preFacet || []),
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: dataStages,
        },
      } as PipelineStage,
    ];

    const [result] = await this.model
      .aggregate<
        AggregateFacetResult<Record<string, unknown>>
      >(aggregatePipeline)
      .exec();

    const total: number = result.metadata[0]?.total ?? 0;
    let documents: Record<string, unknown>[] = result.data;

    if (populateArgs && documents.length > 0) {
      documents = (await this.model.populate(
        documents as unknown as TDocument[],
        populateArgs as string | PopulateOptions | PopulateOptions[],
      )) as unknown as Record<string, unknown>[];
    }

    const data = mapFn
      ? (documents as unknown as TDoc[]).map((doc) => mapFn(doc))
      : (documents.map((doc) =>
          this.toDomain(doc as unknown as TDocument),
        ) as unknown as R[]);

    return {
      data,
      meta: this.buildMeta(page, limit, total),
    };
  }

  protected async executeCursorQuery<
    R = TEntity,
    TDoc = Record<string, unknown>,
  >(
    filter: FilterQuery<TDocument>,
    limit: number = DEFAULT_LIMIT,
    sort: Record<string, 1 | -1> = { _id: -1 },
    mapFn?: (doc: TDoc) => R,
    populateArgs?: PopulateOptions | PopulateOptions[] | string | string[],
    pipelineStages?: PipelineStage[],
  ): Promise<CursorPaginatedResult<R>> {
    const aggregatePipeline: PipelineStage[] = [
      { $match: filter },
      ...(pipelineStages || []),
      { $sort: sort },
      { $limit: limit + 1 },
    ];

    let docs: Record<string, unknown>[] = await this.model
      .aggregate<Record<string, unknown>>(aggregatePipeline)
      .exec();
    const hasMore = docs.length > limit;

    if (hasMore) {
      docs.pop();
    }

    if (populateArgs && docs.length > 0) {
      docs = (await this.model.populate(
        docs as unknown as TDocument[],
        populateArgs as string | PopulateOptions | PopulateOptions[],
      )) as unknown as Record<string, unknown>[];
    }

    const data = mapFn
      ? (docs as unknown as TDoc[]).map((doc) => mapFn(doc))
      : (docs.map((doc) =>
          this.toDomain(doc as unknown as TDocument),
        ) as unknown as R[]);

    const nextCursor =
      hasMore && docs.length > 0
        ? (
            docs[docs.length - 1] as { _id: { toString(): string } }
          )._id.toString()
        : null;

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
