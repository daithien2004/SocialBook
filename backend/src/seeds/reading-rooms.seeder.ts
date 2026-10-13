import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';

const ROOM_CONFIGS = [
  { bookIndex: 0, chapterIndex: 0, mode: 'sync' },
  { bookIndex: 0, chapterIndex: 0, mode: 'free' },
  { bookIndex: 1, chapterIndex: 0, mode: 'sync' },
  { bookIndex: 2, chapterIndex: -1, mode: 'free' },
  { bookIndex: 3, chapterIndex: -1, mode: 'sync' },
] as const;

@Injectable()
export class ReadingRoomsSeed {
  private readonly logger = new Logger(ReadingRoomsSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    await this.prisma.readingRoom.deleteMany({
      where: { id: { startsWith: 'DEMO' } },
    });

    const [users, books] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true } }),
      this.prisma.book.findMany({
        where: { isDeleted: false },
        include: {
          chapters: {
            where: { isDeleted: false },
            orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
            include: {
              paragraphs: {
                orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
                select: { id: true, content: true },
              },
            },
          },
        },
      }),
    ]);

    if (users.length < 3 || books.length === 0) {
      this.logger.warn('Not enough PostgreSQL users and books to seed rooms.');
      return;
    }

    const highlightTemplates = [
      (content: string) => `A precise passage: "${content.slice(0, 80)}..."`,
      (content: string) => `This detail matters: "${content.slice(0, 60)}..."`,
      (content: string) =>
        `A memorable sentence: "${content.slice(0, 100)}..."`,
    ];

    let createdRooms = 0;
    for (const [index, config] of ROOM_CONFIGS.entries()) {
      const book = books.at(config.bookIndex) ?? books.at(0);
      if (!book) continue;
      const chapter =
        config.chapterIndex < 0
          ? book.chapters.at(config.chapterIndex)
          : book.chapters.find(
              (_, chapterIndex) => chapterIndex === config.chapterIndex,
            );
      const host = users.at(index % users.length);
      if (!chapter || !host) continue;

      const memberIds = users
        .filter((user) => user.id !== host.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((user) => user.id);
      const allMemberIds = [host.id, ...memberIds];
      const createdAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const highlights = chapter.paragraphs.slice(0, 3).map((paragraph, i) => {
        const template = highlightTemplates[i % highlightTemplates.length];
        const userId =
          allMemberIds[Math.floor(Math.random() * allMemberIds.length)] ??
          host.id;
        return {
          id: `DEMO0${String(index + 1)}-hl-${String(i + 1)}`,
          userId,
          chapterSlug: chapter.slug,
          paragraphId: paragraph.id,
          content: template(paragraph.content),
          createdAt: new Date(Date.now() - (i + 1) * 60 * 60 * 1000),
        };
      });

      await this.prisma.readingRoom.create({
        data: {
          id: `DEMO0${String(index + 1)}`,
          bookId: book.id,
          hostId: host.id,
          mode: config.mode,
          status: 'active',
          currentChapterId: chapter.id,
          currentChapterSlug: chapter.slug,
          maxMembers: 10,
          createdAt,
          updatedAt: new Date(),
          members: {
            create: allMemberIds.map((userId, memberIndex) => ({
              userId,
              role: memberIndex === 0 ? 'host' : 'member',
              joinedAt: createdAt,
            })),
          },
          highlights: { create: highlights },
        },
      });
      createdRooms += 1;
    }

    this.logger.log(`Seeded ${createdRooms} reading rooms in PostgreSQL.`);
  }
}
