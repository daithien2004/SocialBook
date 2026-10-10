import {
  buildPaginationMeta,
  PaginatedResult,
  PaginationOptions,
} from '@/shared/domain/pagination.types';
import { Author as AuthorEntity } from '../../domain/entities/author.entity';
import {
  AuthorFilter,
  IAuthorRepository,
} from '../../domain/repositories/author.repository.interface';
import { AuthorId } from '../../domain/value-objects/author-id.vo';
import { AuthorName } from '../../domain/value-objects/author-name.vo';
import { Author, AuthorDocument } from '../schemas/author.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';

import { MongoSessionContext } from '@/shared/infrastructure/mongo-session.context';
import { Types } from 'mongoose';

@Injectable()
export class AuthorRepository implements IAuthorRepository {
  constructor(
    @InjectModel(Author.name)
    private readonly authorModel: Model<AuthorDocument>,
    private readonly sessionContext: MongoSessionContext,
  ) {}

  protected toDomain(doc: AuthorDocument): AuthorEntity {
    return this.mapToEntity(doc);
  }

  protected toPersistence(entity: AuthorEntity): Partial<AuthorDocument> {
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
    const query = this.authorModel.findOne({ name: name.toString() });
    if (this.sessionContext.currentSession) {
      query.session(this.sessionContext.currentSession);
    }
    const document = await query.lean().exec();
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
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async save(author: AuthorEntity): Promise<void> {
    const id = new Types.ObjectId(author.id.toString());
    const query = this.authorModel.findOneAndUpdate(
      { _id: id },
      { $set: this.toPersistence(author), $setOnInsert: { _id: id } },
      { upsert: true, new: true },
    );
    if (this.sessionContext.currentSession) {
      query.session(this.sessionContext.currentSession);
    }
    await query.exec();
  }

  async delete(id: AuthorId): Promise<void> {
    await this.authorModel.findByIdAndDelete(id.toString()).exec();
  }

  async existsByName(name: AuthorName, excludeId?: AuthorId): Promise<boolean> {
    const query: FilterQuery<AuthorDocument> = { name: name.toString() };
    if (excludeId) {
      query._id = { $ne: excludeId.toString() };
    }

    const count = await this.authorModel.countDocuments(query).exec();
    return count > 0;
  }

  private mapToEntity(document: AuthorDocument): AuthorEntity {
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
