import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { BookmarkRepository } from '@/modules/bookmarks/domain/repositories/bookmark.repository';
import { Bookmark as BookmarkEntity } from '@/modules/bookmarks/domain/entities/bookmark.entity';
import { BookmarkPersistenceMapper } from './bookmark.mapper';

@Injectable()
export class PrismaBookmarkRepository extends BookmarkRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  async save(bookmark: BookmarkEntity): Promise<void> {
    try {
      await this.transactionHost.tx.bookmark.create({
        data: BookmarkPersistenceMapper.toCreateInput(bookmark),
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictDomainException(
          'This paragraph is already bookmarked',
        );
      }
      throw error;
    }
  }

  async findByParagraph(
    userId: string,
    paragraphId: string,
  ): Promise<BookmarkEntity | null> {
    const row = await this.transactionHost.tx.bookmark.findUnique({
      where: { userId_paragraphId: { userId, paragraphId } },
    });
    return row ? BookmarkPersistenceMapper.toDomain(row) : null;
  }

  async deleteByParagraph(userId: string, paragraphId: string): Promise<void> {
    await this.transactionHost.tx.bookmark.deleteMany({
      where: { userId, paragraphId },
    });
  }
}
