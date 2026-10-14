export { AuthorsModule } from './authors.module';
export { AuthorsInfrastructureModule } from './infrastructure/authors-infrastructure.module';
export { AuthorReadRepository } from './application/ports/author-read.repository';
export { AuthorIndexReadRepository } from './application/ports/author-index-read.repository';
export type { AuthorReadModel } from './application/read-models/author.read-model';
export type { AuthorSearchReadModel } from './application/read-models/author-search.read-model';
export { CreateAuthorCommand } from './application/commands/create-author/create-author.command';
export { FindAuthorByNameQuery } from './application/queries/find-author-by-name/find-author-by-name.query';
