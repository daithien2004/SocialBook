import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { IBookmarkRepository } from '@/modules/bookmarks/domain/repositories/bookmark.repository.interface';
import { Bookmark as BookmarkEntity } from '@/modules/bookmarks/domain/entities/bookmark.entity';
import { BookmarkMapper } from './bookmark.mapper';

@Injectable()
export class PrismaBookmarkRepository implements IBookmarkRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async save(bookmark: BookmarkEntity): Promise<void> {
    try {
      await this.transactionHost.tx.bookmark.upsert({
        where: { id: bookmark.id },
        create: BookmarkMapper.toCreateInput(bookmark),
        update: {
          bookId: bookmark.bookId,
          chapterId: bookmark.chapterId,
          chapterSlug: bookmark.chapterSlug,
          textPreview: bookmark.textPreview,
          updatedAt: bookmark.updatedAt,
        },
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
    return row ? BookmarkMapper.toDomain(row) : null;
  }

  async findByBook(userId: string, bookId: string): Promise<BookmarkEntity[]> {
    const rows = await this.transactionHost.tx.bookmark.findMany({
      where: { userId, bookId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map((row) => BookmarkMapper.toDomain(row));
  }

  async deleteByParagraph(userId: string, paragraphId: string): Promise<void> {
    await this.transactionHost.tx.bookmark.deleteMany({
      where: { userId, paragraphId },
    });
  }
}
