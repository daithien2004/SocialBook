import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

@Injectable()
export class ReviewsSeed {
  private readonly logger = new Logger(ReviewsSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    if (await this.prisma.review.count()) return;
    const [users, books] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true } }),
      this.prisma.book.findMany({
        where: { isDeleted: false },
        select: { id: true },
      }),
    ]);
    if (!users.length || !books.length) return;
    const data = books.flatMap((book, bookIndex) => {
      const reviewerCount = Math.min(2, users.length);
      return users.slice(0, reviewerCount).map((user, userIndex) => ({
        id: createSeedId(),
        userId: user.id,
        bookId: book.id,
        content: `Seed review ${String(bookIndex + 1)}-${String(userIndex + 1)}: an enjoyable read with memorable characters.`,
        rating: 3 + ((bookIndex + userIndex) % 3),
        moderationStatus: 'approved',
      }));
    });
    await this.prisma.review.createMany({ data, skipDuplicates: true });
    this.logger.log(`Seeded ${String(data.length)} reviews.`);
  }
}
