import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

@Injectable()
export class PostsSeed {
  private readonly logger = new Logger(PostsSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    if (await this.prisma.post.count()) return;
    const [users, books] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true } }),
      this.prisma.book.findMany({
        where: { isDeleted: false },
        select: { id: true },
      }),
    ]);
    if (!users.length || !books.length) {
      this.logger.warn('Users or books are missing; posts were not seeded.');
      return;
    }
    const templates = [
      'I just finished a wonderful book. What should I read next?',
      'Looking for a new genre to explore this weekend.',
      'This story has stayed with me since I finished it.',
      'Paper books or ebooks? I still love the feel of paper.',
    ];
    const now = new Date();
    const data = users.flatMap((user) =>
      Array.from({ length: 2 }, (_, index) => ({
        id: createSeedId(),
        userId: user.id,
        bookId: books[(users.indexOf(user) + index) % books.length].id,
        content: templates[(users.indexOf(user) + index) % templates.length],
        imageUrls: [],
        moderationStatus: 'approved',
        createdAt: new Date(now.getTime() - Math.random() * 14 * 86_400_000),
        updatedAt: now,
      })),
    );
    await this.prisma.post.createMany({ data });
    this.logger.log(`Seeded ${data.length} posts.`);
  }
}
