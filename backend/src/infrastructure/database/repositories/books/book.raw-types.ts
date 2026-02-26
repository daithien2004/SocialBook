import { Types } from 'mongoose';

export interface BookPersistence {
    title: string;
    slug: string;
    authorId: Types.ObjectId;
    genres: Types.ObjectId[];
    description: string;
    publishedYear: string;
    coverUrl: string;
    status: string;
    tags: string[];
    views: number;
    likes: number;
    likedBy: Types.ObjectId[];
    updatedAt: Date;
}

export interface RawGenre {
    _id: Types.ObjectId;
    name: string;
    slug: string;
}

export interface RawParagraph {
    _id: Types.ObjectId;
    content: string;
}

export interface RawChapter {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    paragraphs: RawParagraph[];
    orderIndex: number;
    viewsCount: number;
    createdAt: Date;
    updatedAt?: Date;
}

export interface RawBookDocument {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    authorId: Types.ObjectId;
    genres: (Types.ObjectId | RawGenre)[];
    description?: string;
    publishedYear?: string;
    coverUrl?: string;
    status?: string;
    tags?: string[];
    views?: number;
    likes?: number;
    likedBy?: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export interface RawBookDetailAggregation extends Omit<RawBookDocument, 'genres'> {
    genres: Types.ObjectId[];
    genreDetails: RawGenre[];
    chapters: RawChapter[];
}
