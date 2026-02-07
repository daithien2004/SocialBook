import { VectorId } from '../value-objects/vector-id.vo';
import { EmbeddingVector } from '../value-objects/embedding-vector.vo';
import { ContentType } from '../value-objects/content-type.vo';

export class SearchQuery {
    private constructor(
        public readonly id: VectorId,
        private _query: string,
        private _embedding: EmbeddingVector,
        private _limit: number,
        private _threshold: number,
        private _contentType?: ContentType,
        private _filters?: Record<string, any>,
        public readonly createdAt: Date = new Date()
    ) {}

    static create(props: {
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
            VectorId.generate(),
            props.query.trim(),
            EmbeddingVector.create(props.embedding),
            props.limit || 10,
            props.threshold || 0.7,
            props.contentType ? ContentType.create(props.contentType) : undefined,
            props.filters,
            new Date()
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
            props.query,
            EmbeddingVector.create(props.embedding),
            props.limit || 10,
            props.threshold || 0.7,
            props.contentType ? ContentType.create(props.contentType) : undefined,
            props.filters,
            props.createdAt
        );
    }

    // Getters
    get query(): string {
        return this._query;
    }

    get embedding(): EmbeddingVector {
        return this._embedding;
    }

    get contentType(): ContentType | undefined {
        return this._contentType;
    }

    get filters(): Record<string, any> | undefined {
        return this._filters ? { ...this._filters } : undefined;
    }

    get limit(): number {
        return this._limit || 10;
    }

    get threshold(): number {
        return this._threshold || 0.7;
    }

    // Business methods
    hasContentType(): boolean {
        return this._contentType !== undefined;
    }

    hasFilters(): boolean {
        return this._filters !== undefined && Object.keys(this._filters).length > 0;
    }

    getFilter(key: string): any {
        return this._filters?.[key];
    }

    addFilter(key: string, value: any): void {
        if (!this._filters) {
            this._filters = {};
        }
        this._filters[key] = value;
    }

    removeFilter(key: string): void {
        if (this._filters) {
            delete this._filters[key];
        }
    }

    updateLimit(newLimit: number): void {
        if (newLimit <= 0) {
            throw new Error('Limit must be greater than 0');
        }
        this._limit = newLimit;
    }

    updateThreshold(newThreshold: number): void {
        if (newThreshold < 0 || newThreshold > 1) {
            throw new Error('Threshold must be between 0 and 1');
        }
        this._threshold = newThreshold;
    }

    matchesContentType(type: 'book' | 'author' | 'chapter'): boolean {
        return this._contentType?.toString() === type;
    }

    // Static methods for common query types
    static createBookSearch(query: string, embedding: number[], limit?: number): SearchQuery {
        return SearchQuery.create({
            query,
            embedding,
            contentType: 'book',
            limit
        });
    }

    static createAuthorSearch(query: string, embedding: number[], limit?: number): SearchQuery {
        return SearchQuery.create({
            query,
            embedding,
            contentType: 'author',
            limit
        });
    }

    static createChapterSearch(query: string, embedding: number[], limit?: number): SearchQuery {
        return SearchQuery.create({
            query,
            embedding,
            contentType: 'chapter',
            limit
        });
    }

    static createGeneralSearch(query: string, embedding: number[], limit?: number): SearchQuery {
        return SearchQuery.create({
            query,
            embedding,
            limit
        });
    }
}
