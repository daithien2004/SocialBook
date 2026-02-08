import { VectorId } from '../value-objects/vector-id.vo';
import { EmbeddingVector } from '../value-objects/embedding-vector.vo';
import { ContentType } from '../value-objects/content-type.vo';

export class VectorDocument {
    private constructor(
        public readonly id: VectorId,
        private _contentId: string,
        private _contentType: ContentType,
        private _content: string,
        private _metadata: Record<string, any>,
        private _embedding: EmbeddingVector,
        public readonly createdAt: Date,
        private _updatedAt: Date
    ) {}

    static create(props: {
        contentId: string;
        contentType: 'book' | 'author' | 'chapter';
        content: string;
        metadata?: Record<string, any>;
        embedding: number[];
    }): VectorDocument {
        if (!props.contentId || props.contentId.trim().length === 0) {
            throw new Error('Content ID cannot be empty');
        }

        if (!props.content || props.content.trim().length === 0) {
            throw new Error('Content cannot be empty');
        }

        return new VectorDocument(
            VectorId.generate(),
            props.contentId.trim(),
            ContentType.create(props.contentType),
            props.content.trim(),
            props.metadata || {},
            EmbeddingVector.create(props.embedding),
            new Date(),
            new Date()
        );
    }

    static reconstitute(props: {
        id: string;
        contentId: string;
        contentType: 'book' | 'author' | 'chapter';
        content: string;
        metadata: Record<string, any>;
        embedding: number[];
        createdAt: Date;
        updatedAt: Date;
    }): VectorDocument {
        return new VectorDocument(
            VectorId.create(props.id),
            props.contentId,
            ContentType.create(props.contentType),
            props.content,
            props.metadata,
            EmbeddingVector.create(props.embedding),
            props.createdAt,
            props.updatedAt
        );
    }

    // Getters
    get contentId(): string {
        return this._contentId;
    }

    get contentType(): ContentType {
        return this._contentType;
    }

    get content(): string {
        return this._content;
    }

    get metadata(): Record<string, any> {
        return { ...this._metadata };
    }

    get embedding(): EmbeddingVector {
        return this._embedding;
    }

    get updatedAt(): Date {
        return this._updatedAt;
    }

    // Business methods
    updateContent(newContent: string): void {
        if (!newContent || newContent.trim().length === 0) {
            throw new Error('Content cannot be empty');
        }

        this._content = newContent.trim();
        this._updatedAt = new Date();
    }

    updateMetadata(newMetadata: Record<string, any>): void {
        this._metadata = { ...newMetadata };
        this._updatedAt = new Date();
    }

    updateEmbedding(newEmbedding: number[]): void {
        this._embedding = EmbeddingVector.create(newEmbedding);
        this._updatedAt = new Date();
    }

    addMetadata(key: string, value: any): void {
        this._metadata[key] = value;
        this._updatedAt = new Date();
    }

    removeMetadata(key: string): void {
        delete this._metadata[key];
        this._updatedAt = new Date();
    }

    calculateSimilarity(other: VectorDocument): number {
        return this._embedding.calculateSimilarity(other._embedding);
    }

    getContentPreview(maxLength: number = 200): string {
        if (this._content.length <= maxLength) {
            return this._content;
        }
        return this._content.substring(0, maxLength) + '...';
    }

    getWordCount(): number {
        return this._content.split(/\s+/).filter(word => word.length > 0).length;
    }

    getCharacterCount(): number {
        return this._content.length;
    }

    matchesContentType(type: 'book' | 'author' | 'chapter'): boolean {
        return this._contentType.toString() === type;
    }

    hasMetadataKey(key: string): boolean {
        return key in this._metadata;
    }

    getMetadataValue(key: string): any {
        return this._metadata[key];
    }

    // Static methods for common operations
    static createBookDocument(contentId: string, content: string, metadata: Record<string, any>, embedding: number[]): VectorDocument {
        return VectorDocument.create({
            contentId,
            contentType: 'book',
            content,
            metadata: { ...metadata, type: 'book' },
            embedding
        });
    }

    static createAuthorDocument(contentId: string, content: string, metadata: Record<string, any>, embedding: number[]): VectorDocument {
        return VectorDocument.create({
            contentId,
            contentType: 'author',
            content,
            metadata: { ...metadata, type: 'author' },
            embedding
        });
    }

    static createChapterDocument(contentId: string, content: string, metadata: Record<string, any>, embedding: number[]): VectorDocument {
        return VectorDocument.create({
            contentId,
            contentType: 'chapter',
            content,
            metadata: { ...metadata, type: 'chapter' },
            embedding
        });
    }
}
