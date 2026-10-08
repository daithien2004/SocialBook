export {
  Genre as GenreSchemaModel,
  GenreSchema,
} from './infrastructure/schemas/genre.schema';
export type { GenreDocument } from './infrastructure/schemas/genre.schema';
export { IGenreRepository } from './domain/repositories/genre.repository.interface';
export { Genre as GenreEntity } from './domain/entities/genre.entity';
export { GenreId } from './domain/value-objects/genre-id.vo';
export { GenreName } from './domain/value-objects/genre-name.vo';
export { GenresInfrastructureModule } from './infrastructure/genres-infrastructure.module';
export { GenresApplicationModule } from './application/genres-application.module';
export { GenresModule } from './genres.module';
