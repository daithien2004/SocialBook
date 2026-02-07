import { ApiProperty } from '@nestjs/swagger';
import { Genre } from '../../domain/entities/genre.entity';

export class GenreResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    slug: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    constructor(genre: Genre) {
        this.id = genre.id.toString();
        this.name = genre.name.toString();
        this.slug = genre.slug;
        this.description = genre.description;
        this.createdAt = genre.createdAt;
        this.updatedAt = genre.updatedAt;
    }

    static fromDomain(genre: Genre): GenreResponseDto {
        return new GenreResponseDto(genre);
    }
}
