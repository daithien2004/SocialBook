import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

@Injectable()
export class ProgressSeed {
  private readonly logger = new Logger(ProgressSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    if (await this.prisma.readingProgress.count()) return;
    const [users, chapters] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true } }),
      this.prisma.chapter.findMany({
        where: { isDeleted: false },
        select: { id: true, bookId: true },
        take: 100,
      }),
    ]);
    const data = users.flatMap((user, userIndex) =>
      chapters
        .slice(userIndex % 5, (userIndex % 5) + 5)
        .map((chapter, chapterIndex) => {
          const progress = chapterIndex === 4 ? 100 : 20 + chapterIndex * 15;
          return {
            id: createSeedId(),
            userId: user.id,
            bookId: chapter.bookId,
            chapterId: chapter.id,
            progress,
            timeSpent: 300 + chapterIndex * 120,
            status: progress === 100 ? 'COMPLETED' : 'READING',
            xpEarned: Math.floor(progress / 2),
            pagesRead: chapterIndex + 1,
            wordsRead: (chapterIndex + 1) * 500,
            lastReadAt: new Date(
              Date.now() - (userIndex + chapterIndex) * 3_600_000,
            ),
          };
        }),
    );
    if (data.length)
      await this.prisma.readingProgress.createMany({
        data,
        skipDuplicates: true,
      });
    this.logger.log(`Seeded ${data.length} reading progress records.`);
  }
}
