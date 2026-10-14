import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import {
  PrismaTransactionClient,
  PrismaTransactionalAdapter,
} from '@/core/database/postgres/prisma-transaction.types';
import { Author as AuthorEntity } from '@/modules/authors/domain/entities/author.entity';
import { AuthorRepository } from '@/modules/authors/domain/repositories/author.repository';
import { AuthorId } from '@/modules/authors/domain/value-objects/author-id.vo';
import { AuthorName } from '@/modules/authors/domain/value-objects/author-name.vo';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { AuthorErrorMessages } from '../../application/error-messages';
import { AuthorMapper } from './author.mapper';

@Injectable()
export class PrismaAuthorRepository extends AuthorRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  private get prisma(): PrismaTransactionClient {
    return this.transactionHost.tx;
  }

  async findById(id: AuthorId): Promise<AuthorEntity | null> {
    const row = await this.prisma.author.findUnique({
      where: { id: id.toString() },
    });
    return row ? AuthorMapper.toDomain(row) : null;
  }

  async save(author: AuthorEntity): Promise<void> {
    const data = AuthorMapper.toPersistence(author);

    try {
      await this.prisma.author.upsert({
        where: { id: author.id.toString() },
        create: data,
        update: {
          name: data.name,
          slug: data.slug,
          bio: data.bio,
          photoUrl: data.photoUrl,
          updatedAt: data.updatedAt,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictDomainException(AuthorErrorMessages.AUTHOR_EXISTS);
      }
      throw error;
    }
  }

  async delete(id: AuthorId): Promise<void> {
    await this.prisma.author.deleteMany({ where: { id: id.toString() } });
  }

  async existsByName(name: AuthorName, excludeId?: AuthorId): Promise<boolean> {
    const row = await this.prisma.author.findFirst({
      where: {
        name: name.toString(),
        ...(excludeId ? { id: { not: excludeId.toString() } } : {}),
      },
      select: { id: true },
    });
    return row !== null;
  }
}
