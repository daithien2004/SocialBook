import { Genre } from '../entities/genre.entity';
import { GenreId } from '../value-objects/genre-id.vo';
import { GenreName } from '../value-objects/genre-name.vo';

export abstract class IGenreRepository {
  abstract findById(id: GenreId): Promise<Genre | null>;
  abstract save(genre: Genre): Promise<void>;
  abstract delete(id: GenreId): Promise<void>;

  abstract existsByName(name: GenreName, excludeId?: GenreId): Promise<boolean>;
}
