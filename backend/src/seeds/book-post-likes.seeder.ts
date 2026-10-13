import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

@Injectable()
export class BookPostLikesSeed {
  private readonly logger = new Logger(BookPostLikesSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    const [users, books, posts] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true } }),
      this.prisma.book.findMany({
        where: { isDeleted: false },
        select: { id: true },
      }),
      this.prisma.post.findMany({ select: { id: true } }),
    ]);
    if (!users.length) return;
    await this.prisma.like.deleteMany({
      where: { targetType: { in: ['book', 'post'] } },
    });
    const likes = [
      ...books.map((book, index) => ({
        id: createSeedId(),
        userId: users[index % users.length].id,
        targetType: 'book',
        targetId: book.id,
      })),
      ...posts.map((post, index) => ({
        id: createSeedId(),
        userId: users[(index + 1) % users.length].id,
        targetType: 'post',
        targetId: post.id,
      })),
    ];
    if (likes.length)
      await this.prisma.like.createMany({ data: likes, skipDuplicates: true });
    this.logger.log(`Seeded ${likes.length} book and post likes.`);
  }
}
