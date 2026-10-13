import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

@Injectable()
export class CommentsSeed {
  private readonly logger = new Logger(CommentsSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    if (await this.prisma.comment.count()) return;
    const [users, posts, chapters] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true } }),
      this.prisma.post.findMany({ select: { id: true }, take: 30 }),
      this.prisma.chapter.findMany({
        where: { isDeleted: false },
        select: { id: true },
        take: 30,
      }),
    ]);
    if (!users.length) return;
    const targets = [
      ...posts.map((post) => ({ id: post.id, type: 'post' })),
      ...chapters.map((chapter) => ({ id: chapter.id, type: 'chapter' })),
    ];
    if (!targets.length) return;
    const comments = targets.map((target, index) => ({
      id: createSeedId(),
      userId: users[index % users.length].id,
      targetType: target.type,
      targetId: target.id,
      content: 'I enjoyed this and would love to hear what others think.',
      moderationStatus: 'approved',
    }));
    await this.prisma.comment.createMany({ data: comments });
    this.logger.log(`Seeded ${comments.length} comments.`);
  }
}
