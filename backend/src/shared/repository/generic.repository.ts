import { NotFoundException } from '@nestjs/common';
import {
  Document,
  FilterQuery,
  Model,
  Types,
  UpdateQuery
} from 'mongoose';

export class GenericRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) { }

  async findMany(options: {
    filter?: FilterQuery<T>;
    page?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
    populate?: string | string[];
  }): Promise<{ data: T[]; meta: { current: number; pageSize: number; total: number; totalPages: number } }> {
    const {
      filter = {},
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      populate,
    } = options;

    const skip = (page - 1) * limit;

    let query = this.model
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort);

    if (populate) query = query.populate(populate);

    const [data, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        current: Number(page),
        pageSize: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string | Types.ObjectId, populate?: string | string[]): Promise<T | null> {
    let query = this.model.findById(id);
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async findOne(
    filter: FilterQuery<T>,
    populate?: string | string[],
  ): Promise<T | null> {
    let query = this.model.findOne(filter);
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async update(
    id: string | Types.ObjectId,
    data: UpdateQuery<T>,
    errorMsg = 'Not found',
  ): Promise<T> {
    const entity = await this.model.findByIdAndUpdate(id, data, { new: true });
    if (!entity) throw new NotFoundException(errorMsg);
    return entity;
  }

  async delete(id: string | Types.ObjectId, errorMsg = 'Not found'): Promise<void> {
    const result = await this.model.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(errorMsg);
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  async softDelete(id: string | Types.ObjectId, errorMsg = 'Not found'): Promise<void> {
    const entity = await this.model.findByIdAndUpdate(id, {
      deletedAt: new Date(),
    });
    if (!entity) throw new NotFoundException(errorMsg);
  }

  getModel(): Model<T> {
    return this.model;
  }
}
