import { Entity } from '@/shared/domain/entity.base';
import { AuthorId } from '../value-objects/author-id.vo';
import { AuthorName } from '../value-objects/author-name.vo';
import slugify from 'slugify';

export interface AuthorProps {
    name: AuthorName;
    slug: string;
    bio: string;
    photoUrl: string;
}

export class Author extends Entity<AuthorId> {
    private _props: AuthorProps;

    private constructor(id: AuthorId, props: AuthorProps, createdAt?: Date, updatedAt?: Date) {
        super(id, createdAt, updatedAt);
        this._props = props;
    }

    static create(props: {
        id: AuthorId;
        name: string;
        bio?: string;
        photoUrl?: string;
    }): Author {
        const name = AuthorName.create(props.name);
        const slug = Author.generateSlug(props.name);
        
        return new Author(
            props.id,
            {
                name,
                slug,
                bio: props.bio?.trim() || '',
                photoUrl: props.photoUrl?.trim() || ''
            }
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
            {
                name: AuthorName.create(props.name),
                slug: props.slug,
                bio: props.bio,
                photoUrl: props.photoUrl
            },
            props.createdAt,
            props.updatedAt
        );
    }

    get name(): AuthorName { return this._props.name; }
    get slug(): string { return this._props.slug; }
    get bio(): string { return this._props.bio; }
    get photoUrl(): string { return this._props.photoUrl; }

    changeName(newName: string): void {
        const name = AuthorName.create(newName);
        this._props.name = name;
        this._props.slug = Author.generateSlug(newName);
        this.markAsUpdated();
    }

    updateBio(bio: string): void {
        this._props.bio = bio.trim();
        this.markAsUpdated();
    }

    updatePhotoUrl(photoUrl: string): void {
        this._props.photoUrl = photoUrl.trim();
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
