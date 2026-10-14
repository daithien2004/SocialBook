import { ApiProperty } from '@nestjs/swagger';
import type { AuthorReadModel } from '../../application/read-models/author.read-model';

export class AuthorResponseDto {
  static fromReadModel(author: AuthorReadModel): AuthorResponseDto {
    const response = new AuthorResponseDto();
    response.id = author.id;
    response.name = author.name;
    response.slug = author.slug;
    response.bio = author.bio;
    response.photoUrl = author.photoUrl;
    response.createdAt = author.createdAt;
    response.updatedAt = author.updatedAt;
    return response;
  }

  static fromArray(authors: AuthorReadModel[]): AuthorResponseDto[] {
    return authors.map((author) => this.fromReadModel(author));
  }

  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  bio!: string;

  @ApiProperty()
  photoUrl!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
