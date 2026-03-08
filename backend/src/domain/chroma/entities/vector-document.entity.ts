import { Entity } from '@/shared/domain/entity.base';
import { VectorId } from '../value-objects/vector-id.vo';
import { EmbeddingVector } from '../value-objects/embedding-vector.vo';
import { ContentType } from '../value-objects/content-type.vo';

export interface VectorDocumentProps {
    contentId: string;
    contentType: ContentType;
    content: string;
    metadata: Record<string, any>;
    embedding: EmbeddingVector;
}

export class VectorDocument extends Entity<VectorId> {
    private _props: VectorDocumentProps;

    private constructor(id: VectorId, props: VectorDocumentProps, createdAt?: Date, updatedAt?: Date) {
        super(id, createdAt, updatedAt);
        this._props = props;
    }

    static create(props: {
        id: string;
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
            VectorId.create(props.id),
            {
                contentId: props.contentId.trim(),
                contentType: ContentType.create(props.contentType),
                content: props.content.trim(),
                metadata: props.metadata || {},
                embedding: EmbeddingVector.create(props.embedding)
            }
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
            {
                contentId: props.contentId,
                contentType: ContentType.create(props.contentType),
                content: props.content,
                metadata: props.metadata,
                embedding: EmbeddingVector.create(props.embedding)
            },
            props.createdAt,
            props.updatedAt
        );
    }

    // Getters
    get contentId(): string { return this._props.contentId; }
    get contentType(): ContentType { return this._props.contentType; }
    get content(): string { return this._props.content; }
    get metadata(): Record<string, any> { return { ...this._props.metadata }; }
    get embedding(): EmbeddingVector { return this._props.embedding; }

    // Business methods
    updateContent(newContent: string): void {
        if (!newContent || newContent.trim().length === 0) {
            throw new Error('Content cannot be empty');
        }

        this._props.content = newContent.trim();
        this.markAsUpdated();
    }

    updateMetadata(newMetadata: Record<string, any>): void {
        this._props.metadata = { ...newMetadata };
        this.markAsUpdated();
    }

    updateEmbedding(newEmbedding: number[]): void {
        this._props.embedding = EmbeddingVector.create(newEmbedding);
        this.markAsUpdated();
    }

    addMetadata(key: string, value: any): void {
        this._props.metadata[key] = value;
        this.markAsUpdated();
    }

    removeMetadata(key: string): void {
        delete this._props.metadata[key];
        this.markAsUpdated();
    }

    calculateSimilarity(other: VectorDocument): number {
        return this._props.embedding.calculateSimilarity(other._props.embedding);
    }

    getContentPreview(maxLength: number = 200): string {
        if (this._props.content.length <= maxLength) {
            return this._props.content;
        }
        return this._props.content.substring(0, maxLength) + '...';
    }

    getWordCount(): number {
        return this._props.content.split(/\s+/).filter(word => word.length > 0).length;
    }

    getCharacterCount(): number {
        return this._props.content.length;
    }

    matchesContentType(type: 'book' | 'author' | 'chapter'): boolean {
        return this._props.contentType.toString() === type;
    }

    hasMetadataKey(key: string): boolean {
        return key in this._props.metadata;
    }

    getMetadataValue(key: string): any {
        return this._props.metadata[key];
    }

    // Static methods for common operations
    static createBookDocument(id: string, contentId: string, content: string, metadata: Record<string, any>, embedding: number[]): VectorDocument {
        return VectorDocument.create({
            id,
            contentId,
            contentType: 'book',
            content,
            metadata: { ...metadata, type: 'book' },
            embedding
        });
    }

    static createAuthorDocument(id: string, contentId: string, content: string, metadata: Record<string, any>, embedding: number[]): VectorDocument {
        return VectorDocument.create({
            id,
            contentId,
            contentType: 'author',
            content,
            metadata: { ...metadata, type: 'author' },
            embedding
        });
    }

    static createChapterDocument(id: string, contentId: string, content: string, metadata: Record<string, any>, embedding: number[]): VectorDocument {
        return VectorDocument.create({
            id,
            contentId,
            contentType: 'chapter',
            content,
            metadata: { ...metadata, type: 'chapter' },
            embedding
        });
    }
}
