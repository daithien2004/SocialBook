import { VectorDocument } from '../../domain/entities/vector-document.entity';

export class VectorDocumentResponseDto {
    constructor(document: VectorDocument) {
        this.id = document.id.toString();
        this.contentId = document.contentId;
        this.contentType = document.contentType.toString();
        this.content = document.content;
        this.metadata = document.metadata;
        this.embedding = document.embedding.toArray();
        this.createdAt = document.createdAt;
        this.updatedAt = document.updatedAt;
    }

    id: string;
    contentId: string;
    contentType: string;
    content: string;
    metadata: Record<string, any>;
    embedding: number[];
    createdAt: Date;
    updatedAt: Date;
}
