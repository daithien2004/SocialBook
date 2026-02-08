import { SearchResult } from '@/domain/chroma/repositories/vector.repository.interface';
import { VectorDocumentResponseDto } from './vector-document.response.dto';

export class SearchResultDto {
    constructor(result: SearchResult) {
        this.document = new VectorDocumentResponseDto(result.document);
        this.score = result.score;
    }

    document: VectorDocumentResponseDto;
    score: number;
}

export class SearchResponseDto {
    constructor(results: SearchResult[], query: string, total?: number) {
        this.query = query;
        this.results = results.map(result => new SearchResultDto(result));
        this.total = total || results.length;
    }

    query: string;
    results: SearchResultDto[];
    total: number;
}

