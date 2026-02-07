import { Types } from 'mongoose';
import { AuthorDocument } from '../infrastructure/schemas/author.schema';

export class AuthorModal {
    id: string;
    name: string;
    bio: string;
    photoUrl: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(author: AuthorDocument) {
        this.id = (author._id as Types.ObjectId).toString();
        this.name = author.name;
        this.bio = author.bio;
        this.photoUrl = author.photoUrl;
        this.createdAt = author.createdAt;
        this.updatedAt = author.updatedAt;
    }

    static fromArray(authors: AuthorDocument[]): AuthorModal[] {
        return authors.map(author => new AuthorModal(author));
    }
}

export class AuthorSelectModal {
    id: string;
    name: string;
    bio: string;

    constructor(author: AuthorDocument) {
        this.id = (author._id as Types.ObjectId).toString();
        this.name = author.name;
        this.bio = author.bio;
    }

    static fromArray(authors: AuthorDocument[]): AuthorSelectModal[] {
        return authors.map(author => new AuthorSelectModal(author));
    }
}
