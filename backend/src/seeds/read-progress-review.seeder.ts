import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

@Injectable()
export class ReadProgressReviewSeed {
  private readonly logger = new Logger(ReadProgressReviewSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    await this.prisma.readingProgress.deleteMany({});
    const [users, books] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true } }),
      this.prisma.book.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          chapters: {
            where: { isDeleted: false },
            orderBy: { orderIndex: 'asc' },
            take: 10,
            select: { id: true },
          },
        },
      }),
    ]);
    const data = users.flatMap((user) =>
      books.flatMap((book) =>
        book.chapters.map((chapter) => ({
          id: createSeedId(),
          userId: user.id,
          bookId: book.id,
          chapterId: chapter.id,
          progress: 100,
          status: 'COMPLETED',
          timeSpent: 1800,
          xpEarned: 50,
          pagesRead: 10,
          wordsRead: 1500,
          lastReadAt: new Date(),
        })),
      ),
    );
    if (data.length)
      await this.prisma.readingProgress.createMany({
        data,
        skipDuplicates: true,
      });
    this.logger.log(
      `Seeded ${data.length} completed chapter records for review eligibility.`,
    );
  }
}
