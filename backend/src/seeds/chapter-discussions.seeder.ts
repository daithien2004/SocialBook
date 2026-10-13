import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

@Injectable()
export class ChapterDiscussionsSeed {
  private readonly logger = new Logger(ChapterDiscussionsSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    const chapters = await this.prisma.chapter.findMany({
      where: { isDeleted: false },
      orderBy: [{ orderIndex: 'desc' }, { id: 'asc' }],
      distinct: ['bookId'],
      select: { id: true },
    });
    const users = await this.prisma.user.findMany({ select: { id: true } });
    if (!chapters.length || !users.length) return;
    await this.prisma.comment.deleteMany({
      where: {
        targetType: 'chapter',
        targetId: { in: chapters.map((chapter) => chapter.id) },
      },
    });
    await this.prisma.comment.createMany({
      data: chapters.map((chapter, index) => ({
        id: createSeedId(),
        userId: users[index % users.length].id,
        targetType: 'chapter',
        targetId: chapter.id,
        content: 'What did you think about this chapter?',
        moderationStatus: 'approved',
      })),
    });
    this.logger.log(`Seeded discussions for ${chapters.length} chapters.`);
  }
}
