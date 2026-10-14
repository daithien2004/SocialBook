import { Author } from '../entities/author.entity';
import { AuthorId } from '../value-objects/author-id.vo';
import { AuthorName } from '../value-objects/author-name.vo';

export abstract class AuthorRepository {
  abstract findById(id: AuthorId): Promise<Author | null>;
  abstract save(author: Author): Promise<void>;
  abstract delete(id: AuthorId): Promise<void>;
  abstract existsByName(
    name: AuthorName,
    excludeId?: AuthorId,
  ): Promise<boolean>;
}
