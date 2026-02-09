import { Entity } from '@/shared/domain/entity.base';
import { GenreId } from '../value-objects/genre-id.vo';
import { GenreName } from '../value-objects/genre-name.vo';
import slugify from 'slugify';

export class Genre extends Entity<GenreId> {
    private constructor(
        id: GenreId,           
        private _name: GenreName,              
        private _slug: string,                
        private _description: string,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, createdAt, updatedAt);
    }

    static create(props: {
        name: string;
        description?: string;
    }): Genre {
        const name = GenreName.create(props.name);
        const slug = Genre.generateSlug(props.name);
        
        return new Genre(
            GenreId.generate(),
            name,
            slug,
            props.description?.trim() || ''
        );
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
            GenreName.create(props.name),
            props.slug,
            props.description,
            props.createdAt,
            props.updatedAt
        );
    }

    get name(): GenreName {
        return this._name;
    }

    get slug(): string {
        return this._slug;
    }

    get description(): string {
        return this._description;
    }

    changeName(newName: string): void {
        const name = GenreName.create(newName);
        this._name = name;
        this._slug = Genre.generateSlug(newName);
        this.markAsUpdated();
    }

    updateDescription(description: string): void {
        this._description = description.trim();
        this.markAsUpdated();
    }

    private static generateSlug(name: string): string {
        return slugify(name, {
            lower: true,
            strict: true,
            locale: 'vi'
        });
    }
}
