import { Injectable } from '@nestjs/common';
import {
  BadRequestDomainException,
  ConflictDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { ErrorMessages } from '@/shared/platform/constants/error-messages';
import { AuthorErrorMessages } from '@/modules/authors/application/error-messages';
import { Author } from '../domain/entities/author.entity';
import { IAuthorRepository } from '../domain/repositories/author.repository.interface';
import { AuthorId } from '../domain/value-objects/author-id.vo';
import { AuthorName } from '../domain/value-objects/author-name.vo';
import {
  PaginatedResult,
  PaginationOptions,
} from '@/shared/domain/pagination.types';

@Injectable()
export class AuthorsService {
  constructor(
    private readonly authorRepository: IAuthorRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async create(name: string, bio?: string, photoUrl?: string): Promise<Author> {
    const authorName = AuthorName.create(name);
    const exists = await this.authorRepository.existsByName(authorName);

    if (exists) {
      throw new ConflictDomainException(AuthorErrorMessages.AUTHOR_EXISTS);
    }

    const author = Author.create({
      id: AuthorId.create(this.idGenerator.generate()),
      name,
      bio,
      photoUrl,
    });

    await this.authorRepository.save(author);
    return author;
  }

  async update(
    id: string,
    name?: string,
    bio?: string,
    photoUrl?: string,
  ): Promise<Author> {
    const authorId = AuthorId.create(id);
    const author = await this.findById(authorId);

    if (name && name.trim() !== author.name.toString()) {
      const authorName = AuthorName.create(name);
      const exists = await this.authorRepository.existsByName(
        authorName,
        authorId,
      );

      if (exists) {
        throw new ConflictDomainException(AuthorErrorMessages.AUTHOR_EXISTS);
      }

      author.changeName(name);
    }

    if (bio !== undefined) {
      author.updateBio(bio);
    }

    if (photoUrl !== undefined) {
      author.updatePhotoUrl(photoUrl);
    }

    await this.authorRepository.save(author);
    return author;
  }

  async delete(id: string): Promise<void> {
    if (!id) {
      throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
    }

    const authorId = AuthorId.create(id);
    await this.findById(authorId);
    await this.authorRepository.delete(authorId);
  }

  async findById(id: string | AuthorId): Promise<Author> {
    const authorId = typeof id === 'string' ? AuthorId.create(id) : id;
    const author = await this.authorRepository.findById(authorId);

    if (!author) {
      throw new NotFoundDomainException(AuthorErrorMessages.AUTHOR_NOT_FOUND);
    }

    return author;
  }

  findAll(
    page: number,
    limit: number,
    name?: string,
    bio?: string,
  ): Promise<PaginatedResult<Author>> {
    const filter = { name, bio };
    const pagination: PaginationOptions = { page, limit };
    return this.authorRepository.findAll(filter, pagination);
  }
}
