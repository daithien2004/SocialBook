import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

@Injectable()
export class LikesSeed {
  private readonly logger = new Logger(LikesSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    const [existingLikes, existingReviewLikes] = await Promise.all([
      this.prisma.like.count(),
      this.prisma.reviewLike.count(),
    ]);
    if (existingLikes || existingReviewLikes) return;
    const [users, posts, comments, reviews] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true } }),
      this.prisma.post.findMany({ select: { id: true }, take: 40 }),
      this.prisma.comment.findMany({ select: { id: true }, take: 40 }),
      this.prisma.review.findMany({ select: { id: true, userId: true } }),
    ]);
    if (!users.length) return;
    const likes = [
      ...posts.map((post, index) => ({
        id: createSeedId(),
        userId: users[index % users.length].id,
        targetType: 'post',
        targetId: post.id,
      })),
      ...comments.map((comment, index) => ({
        id: createSeedId(),
        userId: users[(index + 1) % users.length].id,
        targetType: 'comment',
        targetId: comment.id,
      })),
    ];
    await this.prisma.like.createMany({ data: likes, skipDuplicates: true });

    for (const [index, review] of reviews.entries()) {
      const user = users.find((candidate) => candidate.id !== review.userId);
      if (!user) continue;
      await this.prisma.reviewLike.upsert({
        where: { reviewId_userId: { reviewId: review.id, userId: user.id } },
        create: { reviewId: review.id, userId: user.id },
        update: {},
      });
      await this.prisma.review.update({
        where: { id: review.id },
        data: { likesCount: { increment: 1 } },
      });
      if (index >= 49) break;
    }
    this.logger.log(`Seeded ${likes.length} social likes.`);
  }
}
