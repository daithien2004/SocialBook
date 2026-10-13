import { Prisma } from '@/core/database/generated/prisma/client';
import { Chapter as ChapterEntity } from '@/modules/chapters/domain/chapters/entities/chapter.entity';

export const CHAPTER_WITH_PARAGRAPHS = {
  paragraphs: { orderBy: { orderIndex: 'asc' } },
} satisfies Prisma.ChapterInclude;

export type ChapterWithParagraphs = Prisma.ChapterGetPayload<{
  include: typeof CHAPTER_WITH_PARAGRAPHS;
}>;

export class ChapterMapper {
  static toDomain(row: ChapterWithParagraphs): ChapterEntity {
    return ChapterEntity.reconstitute({
      id: row.id,
      title: row.title,
      slug: row.slug,
      bookId: row.bookId,
      paragraphs: row.paragraphs.map(({ id, content }) => ({ id, content })),
      viewsCount: row.viewsCount,
      orderIndex: row.orderIndex,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
      ttsStatus: this.toTtsStatus(row.ttsStatus),
      audioUrl: row.audioUrl ?? undefined,
    });
  }

  static toTtsStatus(
    value: string | null,
  ): 'pending' | 'processing' | 'completed' | 'failed' | undefined {
    switch (value) {
      case 'pending':
      case 'processing':
      case 'completed':
      case 'failed':
        return value;
      case null:
      default:
        return undefined;
    }
  }
}
