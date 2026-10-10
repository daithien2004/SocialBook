import {
  buildPaginationMeta,
  PaginatedResult,
  PaginationOptions,
} from '@/shared/domain/pagination.types';
import { Genre as GenreEntity } from '@/modules/genres/domain/entities/genre.entity';
import {
  GenreFilter,
  IGenreRepository,
} from '@/modules/genres/domain/repositories/genre.repository.interface';
import { GenreId } from '@/modules/genres/domain/value-objects/genre-id.vo';
import { GenreName } from '@/modules/genres/domain/value-objects/genre-name.vo';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Genre, GenreDocument } from '../schemas/genre.schema';
import { GenreMapper } from './genre.mapper';
import { GenrePersistence } from './genre.mapper';

import { MongoSessionContext } from '@/shared/infrastructure/mongo-session.context';

@Injectable()
export class GenresRepository implements IGenreRepository {
  constructor(
    @InjectModel(Genre.name) private readonly genreModel: Model<GenreDocument>,
    private readonly sessionContext: MongoSessionContext,
  ) {}

  protected toDomain(doc: GenreDocument): GenreEntity {
    return GenreMapper.toDomain(doc);
  }

  protected toPersistence(entity: GenreEntity): GenrePersistence {
    return GenreMapper.toPersistence(entity);
  }

  async findById(id: GenreId): Promise<GenreEntity | null> {
    const doc = await this.genreModel.findById(id.toString()).lean().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByName(name: GenreName): Promise<GenreEntity | null> {
    const query = this.genreModel.findOne({ name: name.toString() });
    if (this.sessionContext.currentSession) {
      query.session(this.sessionContext.currentSession);
    }
    const doc = await query.lean().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findBySlugs(slugs: string[]): Promise<GenreEntity[]> {
    const docs = await this.genreModel
      .find({ slug: { $in: slugs } })
      .lean()
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findAll(
    filter: GenreFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<GenreEntity>> {
    const query: FilterQuery<GenreDocument> = {};

    if (filter.name) {
      query.name = { $regex: filter.name, $options: 'i' };
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [docs, total] = await Promise.all([
      this.genreModel
        .find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean()
        .exec(),
      this.genreModel.countDocuments(query).exec(),
    ]);

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async findAllSimple(): Promise<GenreEntity[]> {
    const docs = await this.genreModel
      .find()
      .select('name slug createdAt updatedAt')
      .sort({ name: 1 })
      .lean()
      .exec();
    return docs.map((doc) =>
      GenreEntity.reconstitute({
        id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug,
        description: '',
        createdAt: doc.createdAt || new Date(),
        updatedAt: doc.updatedAt || new Date(),
      }),
    );
  }

  async findByNames(names: string[]): Promise<GenreEntity[]> {
    const docs = await this.genreModel
      .find({ name: { $in: names.map((n) => new RegExp(`^${n}$`, 'i')) } })
      .lean()
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async existsByName(name: GenreName, excludeId?: GenreId): Promise<boolean> {
    const query: FilterQuery<GenreDocument> = { name: name.toString() };
    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId.toString()) };
    }
    const result = await this.genreModel.exists(query);
    return !!result;
  }

  async save(genre: GenreEntity): Promise<void> {
    const id = new Types.ObjectId(genre.id.toString());
    const query = this.genreModel.findOneAndUpdate(
      { _id: id },
      { $set: this.toPersistence(genre), $setOnInsert: { _id: id } },
      { upsert: true, new: true },
    );
    if (this.sessionContext.currentSession) {
      query.session(this.sessionContext.currentSession);
    }
    await query.exec();
  }

  async delete(id: GenreId): Promise<void> {
    await this.genreModel.findByIdAndDelete(id.toString()).exec();
  }
}
