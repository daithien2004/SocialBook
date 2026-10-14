import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { GenreErrorMessages } from '@/modules/genres/application/error-messages';
import {
  PrismaTransactionClient,
  PrismaTransactionalAdapter,
} from '@/core/database/postgres/prisma-transaction.types';
import { Genre as GenreEntity } from '@/modules/genres/domain/entities/genre.entity';
import { IGenreRepository } from '@/modules/genres/domain/repositories/genre.repository.interface';
import { GenreId } from '@/modules/genres/domain/value-objects/genre-id.vo';
import { GenreName } from '@/modules/genres/domain/value-objects/genre-name.vo';
import { GenreMapper } from './genre.mapper';

@Injectable()
export class GenresRepository implements IGenreRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  private get prisma(): PrismaTransactionClient {
    return this.transactionHost.tx;
  }

  async findById(id: GenreId): Promise<GenreEntity | null> {
    const row = await this.prisma.genre.findUnique({
      where: { id: id.toString() },
    });
    return row ? GenreMapper.toDomain(row) : null;
  }

  async existsByName(name: GenreName, excludeId?: GenreId): Promise<boolean> {
    const row = await this.prisma.genre.findFirst({
      where: {
        name: name.toString(),
        ...(excludeId ? { id: { not: excludeId.toString() } } : {}),
      },
      select: { id: true },
    });
    return row !== null;
  }

  async save(genre: GenreEntity): Promise<void> {
    const data = GenreMapper.toPersistence(genre);
    const { id, createdAt: _createdAt, ...updateData } = data;

    try {
      await this.prisma.genre.upsert({
        where: { id },
        create: data,
        update: updateData,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictDomainException(GenreErrorMessages.GENRE_EXISTS);
      }
      throw error;
    }
  }

  async delete(id: GenreId): Promise<void> {
    await this.prisma.genre.deleteMany({ where: { id: id.toString() } });
  }
}
