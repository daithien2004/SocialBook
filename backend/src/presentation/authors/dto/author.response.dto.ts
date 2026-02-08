import { Author } from "@/domain/authors/entities/author.entity";

export class AuthorResponseDto {
    constructor(author: Author) {
        this.id = author.id.toString();
        this.name = author.name.toString();
        this.slug = author.slug;
        this.bio = author.bio;
        this.photoUrl = author.photoUrl;
        this.createdAt = author.createdAt;
        this.updatedAt = author.updatedAt;
    }

    id: string;
    name: string;
    slug: string;
    bio: string;
    photoUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

