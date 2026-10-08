import { ApiProperty } from '@nestjs/swagger';
import { Author } from '@/modules/authors/domain/entities/author.entity';

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

  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  bio: string;

  @ApiProperty()
  photoUrl: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
