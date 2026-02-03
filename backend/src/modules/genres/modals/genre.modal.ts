import { Types } from 'mongoose';
import { GenreDocument } from '../schemas/genre.schema';

export class GenreModal {
    id: string;
    name: string;
    slug: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(genre: GenreDocument) {
        this.id = (genre._id as Types.ObjectId).toString();
        this.name = genre.name;
        this.slug = genre.slug;
        this.description = genre.description;
        this.createdAt = genre.createdAt;
        this.updatedAt = genre.updatedAt;
    }

    static fromArray(genres: GenreDocument[]): GenreModal[] {
        return genres.map(genre => new GenreModal(genre));
    }
}

// For select dropdown (minimal data)
export class GenreSelectModal {
    id: string;
    name: string;
    slug: string;

    constructor(genre: GenreDocument) {
        this.id = (genre._id as Types.ObjectId).toString();
        this.name = genre.name;
        this.slug = genre.slug;
    }

    static fromArray(genres: GenreDocument[]): GenreSelectModal[] {
        return genres.map(genre => new GenreSelectModal(genre));
    }
}
