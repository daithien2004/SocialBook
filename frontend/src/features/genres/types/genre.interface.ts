export {
  genreSchema,
  type Genre,
  genrePageSchema,
  type GenrePage,
  type PaginatedData,
  createGenreSchema,
  type CreateGenreRequest,
  updateGenreRequestSchema,
  type UpdateGenreRequest,
} from '../schemas/genre.schema';
export type { PaginationMetaData } from '@/lib/pagination.schema';