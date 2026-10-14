import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { GenreReadModel } from '../read-models/genre.read-model';

export abstract class GenreReadRepository {
  abstract findById(
    ability: AppAbility,
    id: string,
  ): Promise<GenreReadModel | null>;

  abstract findByName(
    ability: AppAbility,
    name: string,
  ): Promise<GenreReadModel | null>;

  abstract findPage(
    ability: AppAbility,
    filter: { name?: string },
    pagination: PageParams,
  ): Promise<PageResult<GenreReadModel>>;

  abstract findBySlugs(slugs: string[]): Promise<GenreReadModel[]>;

  abstract findByNames(names: string[]): Promise<GenreReadModel[]>;

  abstract findAllSimple(): Promise<GenreReadModel[]>;

  abstract countActiveBooksByGenre(id: string): Promise<number>;
}
