export { AuthorsModule } from './authors.module';
export { AuthorsInfrastructureModule } from './infrastructure/authors-infrastructure.module';
export { Author as AuthorEntity } from './domain/entities/author.entity';
export { AuthorId } from './domain/value-objects/author-id.vo';
export { AuthorName } from './domain/value-objects/author-name.vo';
export { IAuthorRepository } from './domain/repositories/author.repository.interface';
export type { AuthorFilter } from './domain/repositories/author.repository.interface';
export {
  Author as AuthorSchemaModel,
  AuthorSchema,
} from './infrastructure/schemas/author.schema';
export type { AuthorDocument } from './infrastructure/schemas/author.schema';
