import { AuthorId } from '../value-objects/author-id.vo';
import { AuthorName } from '../value-objects/author-name.vo';
import { Entity } from '../../../shared/domain/entity.base';
import slugify from 'slugify';

export class Author extends Entity<AuthorId> {
    private constructor(
        id: AuthorId,
        private _name: AuthorName,
        private _slug: string,
        private _bio: string,
        private _photoUrl: string,
        createdAt: Date,
        updatedAt: Date
    ) {
        super(id, createdAt, updatedAt);
    }

    static create(props: {
        name: string;
        bio?: string;
        photoUrl?: string;
    }): Author {
        const name = AuthorName.create(props.name);
        const slug = Author.generateSlug(props.name);

        return new Author(
            AuthorId.generate(),
            name,
            slug,
            props.bio?.trim() || '',
            props.photoUrl?.trim() || '',
            new Date(),
            new Date()
        );
    }

    static reconstitute(props: {
        id: string;
        name: string;
        slug: string;
        bio: string;
        photoUrl: string;
        createdAt: Date;
        updatedAt: Date;
    }): Author {
        return new Author(
            AuthorId.create(props.id),
            AuthorName.create(props.name),
            props.slug,
            props.bio,
            props.photoUrl,
            props.createdAt,
            props.updatedAt
        );
    }

    get name(): AuthorName {
        return this._name;
    }

    get slug(): string {
        return this._slug;
    }

    get bio(): string {
        return this._bio;
    }

    get photoUrl(): string {
        return this._photoUrl;
    }

    changeName(newName: string): void {
        const name = AuthorName.create(newName);
        this._name = name;
        this._slug = Author.generateSlug(newName);
        this.markAsUpdated();
    }

    updateBio(bio: string): void {
        this._bio = bio.trim();
        this.markAsUpdated();
    }

    updatePhotoUrl(photoUrl: string): void {
        this._photoUrl = photoUrl.trim();
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
