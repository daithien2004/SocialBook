import { VectorDocument } from "@/domain/chroma/entities/vector-document.entity";
import { SearchResult } from "@/domain/chroma/repositories/vector.repository.interface";

export class VectorDocumentResponseDto {
    id: string;
    contentId: string;
    contentType: string;
    content: string;
    metadata: Record<string, any>;
    embedding: number[];
    createdAt: Date;
    updatedAt: Date;

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

    static fromArray(documents: VectorDocument[]): VectorDocumentResponseDto[] {
        return documents.map(doc => new VectorDocumentResponseDto(doc));
    }
}

export class SearchResultDto {
    document: VectorDocumentResponseDto;
    score: number;

    constructor(result: SearchResult) {
        this.document = new VectorDocumentResponseDto(result.document);
        this.score = result.score;
    }

    static fromArray(results: SearchResult[]): SearchResultDto[] {
        return results.map(result => new SearchResultDto(result));
    }
}

export class SearchResponseDto {
    query: string;
    results: SearchResultDto[];
    total: number;

    constructor(results: SearchResult[], query: string, total?: number) {
        this.query = query;
        this.results = results.map(result => new SearchResultDto(result));
        this.total = total || results.length;
    }

    static fromResults(results: SearchResult[], query: string, total?: number): SearchResponseDto {
        return new SearchResponseDto(results, query, total);
    }
}

