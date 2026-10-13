import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { createSeedId } from './seed-id';

@Injectable()
export class FollowsSeed {
  private readonly logger = new Logger(FollowsSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    if (await this.prisma.follow.count()) return;
    const users = await this.prisma.user.findMany({ select: { id: true } });
    if (users.length < 2) return;
    const follows = users.flatMap((user, index) => {
      const target = users[(index + 1) % users.length];
      return target.id !== user.id
        ? [{ id: createSeedId(), userId: user.id, targetId: target.id }]
        : [];
    });
    await this.prisma.follow.createMany({
      data: follows,
      skipDuplicates: true,
    });
    this.logger.log(`Seeded ${follows.length} follows.`);
  }
}
