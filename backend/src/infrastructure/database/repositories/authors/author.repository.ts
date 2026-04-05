import {
  PaginatedResult,
  PaginationOptions,
} from '@/common/interfaces/pagination.interface';
import { Author as AuthorEntity } from '@/domain/authors/entities/author.entity';
import {
  AuthorFilter,
  IAuthorRepository,
} from '@/domain/authors/repositories/author.repository.interface';
import { AuthorId } from '@/domain/authors/value-objects/author-id.vo';
import { AuthorName } from '@/domain/authors/value-objects/author-name.vo';
import {
  Author,
  AuthorDocument,
} from '@/infrastructure/database/schemas/author.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';

import { BaseMongoRepository } from '@/shared/infrastructure/base-mongo.repository';

@Injectable()
export class AuthorRepository
  extends BaseMongoRepository<AuthorEntity, AuthorDocument, AuthorId>
  implements IAuthorRepository
{
  constructor(
    @InjectModel(Author.name)
    private readonly authorModel: Model<AuthorDocument>,
  ) {
    super(authorModel);
  }

  protected toDomain(doc: AuthorDocument): AuthorEntity {
    return this.mapToEntity(doc);
  }

  protected toPersistence(entity: AuthorEntity): any {
    return this.mapToDocument(entity);
  }

  async findById(id: AuthorId): Promise<AuthorEntity | null> {
    const document = await this.authorModel
      .findById(id.toString())
      .lean()
      .exec();
    return document ? this.mapToEntity(document) : null;
  }

  async findByName(name: AuthorName): Promise<AuthorEntity | null> {
    const document = await this.authorModel
      .findOne({ name: name.toString() })
      .lean()
      .exec();
    return document ? this.mapToEntity(document) : null;
  }

  async findAll(
    filter: AuthorFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<AuthorEntity>> {
    const queryFilter: FilterQuery<AuthorDocument> = {};

    if (filter.name) {
      queryFilter.name = { $regex: filter.name, $options: 'i' };
    }

    if (filter.bio) {
      queryFilter.bio = { $regex: filter.bio, $options: 'i' };
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const total = await this.authorModel.countDocuments(queryFilter).exec();
    const documents = await this.authorModel
      .find(queryFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pagination.limit)
      .lean()
      .exec();

    return {
      data: documents.map((doc) => this.mapToEntity(doc)),
      meta: this.buildMeta(pagination.page, pagination.limit, total),
    };
  }

  async findAllSimple(): Promise<AuthorEntity[]> {
    const documents = await this.authorModel
      .find()
      .select('name bio photoUrl slug createdAt updatedAt')
      .sort({ name: 1 })
      .lean()
      .exec();

    return documents.map((doc) => this.mapToEntity(doc));
  }

  async save(author: AuthorEntity): Promise<void> {
    return this.baseSave(author);
  }

  async delete(id: AuthorId): Promise<void> {
    return this.baseDelete(id);
  }

  async existsByName(name: AuthorName, excludeId?: AuthorId): Promise<boolean> {
    const query: FilterQuery<AuthorDocument> = { name: name.toString() };
    if (excludeId) {
      query._id = { $ne: excludeId.toString() };
    }

    const count = await this.authorModel.countDocuments(query).exec();
    return count > 0;
  }

  async countActive(): Promise<number> {
    return await this.authorModel.countDocuments().exec();
  }

  private mapToEntity(document: any): AuthorEntity {
    return AuthorEntity.reconstitute({
      id: document._id.toString(),
      name: document.name,
      slug: document.slug || this.generateSlug(document.name),
      bio: document.bio || '',
      photoUrl: document.photoUrl || '',
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  private mapToDocument(author: AuthorEntity): Partial<AuthorDocument> {
    return {
      name: author.name.toString(),
      slug: author.slug,
      bio: author.bio,
      photoUrl: author.photoUrl,
      updatedAt: author.updatedAt,
    };
  }

  async searchByName(
    query: string,
    limit: number = 10,
  ): Promise<AuthorEntity[]> {
    if (!query) return [];

    // Normalize for better matching if needed, or simple regex
    const regex = new RegExp(query, 'i');

    const documents = await this.authorModel
      .find({ name: { $regex: regex } })
      .limit(limit)
      .lean()
      .exec();

    return documents.map((doc) => this.mapToEntity(doc));
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
