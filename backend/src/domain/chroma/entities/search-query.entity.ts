import { VectorId } from '../value-objects/vector-id.vo';
import { EmbeddingVector } from '../value-objects/embedding-vector.vo';
import { ContentType } from '../value-objects/content-type.vo';

export interface SearchQueryProps {
  query: string;
  embedding: EmbeddingVector;
  limit: number;
  threshold: number;
  contentType?: ContentType;
  filters?: Record<string, any>;
}

export class SearchQuery {
  private _props: SearchQueryProps;
  public readonly id: VectorId;
  public readonly createdAt: Date;

  private constructor(
    id: VectorId,
    props: SearchQueryProps,
    createdAt: Date = new Date(),
  ) {
    this.id = id;
    this._props = props;
    this.createdAt = createdAt;
  }

  static create(props: {
    id: string;
    query: string;
    embedding: number[];
    contentType?: 'book' | 'author' | 'chapter';
    filters?: Record<string, any>;
    limit?: number;
    threshold?: number;
  }): SearchQuery {
    if (!props.query || props.query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    return new SearchQuery(
      VectorId.create(props.id),
      {
        query: props.query.trim(),
        embedding: EmbeddingVector.create(props.embedding),
        limit: props.limit || 10,
        threshold: props.threshold || 0.7,
        contentType: props.contentType
          ? ContentType.create(props.contentType)
          : undefined,
        filters: props.filters,
      },
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    query: string;
    embedding: number[];
    contentType?: 'book' | 'author' | 'chapter';
    filters?: Record<string, any>;
    limit?: number;
    threshold?: number;
    createdAt: Date;
  }): SearchQuery {
    return new SearchQuery(
      VectorId.create(props.id),
      {
        query: props.query,
        embedding: EmbeddingVector.create(props.embedding),
        limit: props.limit || 10,
        threshold: props.threshold || 0.7,
        contentType: props.contentType
          ? ContentType.create(props.contentType)
          : undefined,
        filters: props.filters,
      },
      props.createdAt,
    );
  }

  // Getters
  get query(): string {
    return this._props.query;
  }
  get embedding(): EmbeddingVector {
    return this._props.embedding;
  }
  get contentType(): ContentType | undefined {
    return this._props.contentType;
  }
  get filters(): Record<string, any> | undefined {
    return this._props.filters ? { ...this._props.filters } : undefined;
  }
  get limit(): number {
    return this._props.limit || 10;
  }
  get threshold(): number {
    return this._props.threshold || 0.7;
  }

  // Business methods
  hasContentType(): boolean {
    return this._props.contentType !== undefined;
  }

  hasFilters(): boolean {
    return (
      this._props.filters !== undefined &&
      Object.keys(this._props.filters).length > 0
    );
  }

  getFilter(key: string): any {
    return this._props.filters?.[key];
  }

  addFilter(key: string, value: any): void {
    if (!this._props.filters) {
      this._props.filters = {};
    }
    this._props.filters[key] = value;
  }

  removeFilter(key: string): void {
    if (this._props.filters) {
      delete this._props.filters[key];
    }
  }

  updateLimit(newLimit: number): void {
    if (newLimit <= 0) {
      throw new Error('Limit must be greater than 0');
    }
    this._props.limit = newLimit;
  }

  updateThreshold(newThreshold: number): void {
    if (newThreshold < 0 || newThreshold > 1) {
      throw new Error('Threshold must be between 0 and 1');
    }
    this._props.threshold = newThreshold;
  }

  matchesContentType(type: 'book' | 'author' | 'chapter'): boolean {
    return this._props.contentType?.toString() === type;
  }

  // Static methods for common query types
  static createBookSearch(
    id: string,
    query: string,
    embedding: number[],
    limit?: number,
  ): SearchQuery {
    return SearchQuery.create({
      id,
      query,
      embedding,
      contentType: 'book',
      limit,
    });
  }

  static createAuthorSearch(
    id: string,
    query: string,
    embedding: number[],
    limit?: number,
  ): SearchQuery {
    return SearchQuery.create({
      id,
      query,
      embedding,
      contentType: 'author',
      limit,
    });
  }

  static createChapterSearch(
    id: string,
    query: string,
    embedding: number[],
    limit?: number,
  ): SearchQuery {
    return SearchQuery.create({
      id,
      query,
      embedding,
      contentType: 'chapter',
      limit,
    });
  }

  static createGeneralSearch(
    id: string,
    query: string,
    embedding: number[],
    limit?: number,
  ): SearchQuery {
    return SearchQuery.create({
      id,
      query,
      embedding,
      limit,
    });
  }
}
