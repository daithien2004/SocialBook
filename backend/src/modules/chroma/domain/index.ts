export { IVectorRepository } from './repositories/vector.repository.interface';
export type {
  SearchResult,
  IndexResult,
  BatchIndexResult,
  CollectionStats,
} from './repositories/vector.repository.interface';
export { VectorDocument } from './entities/vector-document.entity';
export { SearchQuery } from './entities/search-query.entity';
export { VectorId } from './value-objects/vector-id.vo';
export { ContentType } from './value-objects/content-type.vo';
export { EmbeddingVector } from './value-objects/embedding-vector.vo';
