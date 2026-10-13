import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

@Injectable()
export class PostsDiverseSeed {
  private readonly logger = new Logger(PostsDiverseSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const oldPosts = await tx.post.findMany({ select: { id: true } });
      await tx.comment.deleteMany({
        where: {
          targetType: 'post',
          targetId: { in: oldPosts.map((post) => post.id) },
        },
      });
      await tx.post.deleteMany({});
      const [users, books] = await Promise.all([
        tx.user.findMany({ select: { id: true } }),
        tx.book.findMany({ where: { isDeleted: false }, select: { id: true } }),
      ]);
      if (!users.length || !books.length) return;
      const content = [
        'A book that made me rethink how I spend my time.',
        'Does anyone have a recommendation for a thoughtful fantasy novel?',
        'I am enjoying the discussion around this story.',
        'The ending was unexpected, but it worked for me.',
      ];
      const posts = Array.from(
        { length: Math.min(30, users.length * 4) },
        (_, index) => ({
          id: createSeedId(),
          userId: users[index % users.length].id,
          bookId: books[index % books.length].id,
          content: content[index % content.length],
          imageUrls: [],
          moderationStatus: 'approved',
          createdAt: new Date(Date.now() - Math.random() * 45 * 86_400_000),
        }),
      );
      await tx.post.createMany({ data: posts });
      const comments = posts.map((post, index) => ({
        id: createSeedId(),
        userId: users[(index + 1) % users.length].id,
        targetType: 'post',
        targetId: post.id,
        content: 'Thanks for sharing this perspective.',
        moderationStatus: 'approved',
      }));
      await tx.comment.createMany({ data: comments });
      this.logger.log(`Seeded ${posts.length} varied posts and comments.`);
    });
  }
}
