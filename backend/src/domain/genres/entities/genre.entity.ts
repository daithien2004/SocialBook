import { Entity } from '@/shared/domain/entity.base';
import { GenreId } from '../value-objects/genre-id.vo';
import { GenreName } from '../value-objects/genre-name.vo';
import slugify from 'slugify';

export interface GenreProps {
  name: GenreName;
  slug: string;
  description: string;
}

export class Genre extends Entity<GenreId> {
  private _props: GenreProps;

  private constructor(
    id: GenreId,
    props: GenreProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: {
    id: GenreId;
    name: string;
    description?: string;
  }): Genre {
    const name = GenreName.create(props.name);
    const slug = Genre.generateSlug(props.name);

    return new Genre(props.id, {
      name,
      slug,
      description: props.description?.trim() || '',
    });
  }

  static reconstitute(props: {
    id: string;
    name: string;
    slug: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
  }): Genre {
    return new Genre(
      GenreId.create(props.id),
      {
        name: GenreName.create(props.name),
        slug: props.slug,
        description: props.description,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  get name(): GenreName {
    return this._props.name;
  }
  get slug(): string {
    return this._props.slug;
  }
  get description(): string {
    return this._props.description;
  }

  changeName(newName: string): void {
    const name = GenreName.create(newName);
    this._props.name = name;
    this._props.slug = Genre.generateSlug(newName);
    this.markAsUpdated();
  }

  updateDescription(description: string): void {
    this._props.description = description.trim();
    this.markAsUpdated();
  }

  private static generateSlug(name: string): string {
    return slugify(name, {
      lower: true,
      strict: true,
      locale: 'vi',
    });
  }
}
