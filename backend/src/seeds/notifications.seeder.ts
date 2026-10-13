import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { Prisma } from '@/core/database/generated/prisma/client';

@Injectable()
export class NotificationSeed {
  private readonly logger = new Logger(NotificationSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    const existingCount = await this.prisma.notification.count();
    if (existingCount > 0) {
      this.logger.warn(`Found ${existingCount} notifications. Skipping seed.`);
      return;
    }

    const users = await this.prisma.user.findMany({
      select: { id: true, username: true, image: true },
      orderBy: { id: 'asc' },
    });
    if (users.length < 2) {
      this.logger.warn(
        'At least two PostgreSQL users are required to seed notifications.',
      );
      return;
    }

    const now = new Date();
    const notifications: Prisma.NotificationCreateManyInput[] = [];
    for (const [index, user] of users.entries()) {
      const actor = users[(index + 1) % users.length];
      if (!actor) continue;

      const createdAt = new Date(now.getTime() - (index + 1) * 60 * 60 * 1000);
      notifications.push(
        {
          id: randomUUID(),
          userId: user.id,
          title: 'Chào mừng đến với SocialBook!',
          message:
            'Cảm ơn bạn đã tham gia SocialBook. Hãy khám phá thư viện sách và kết nối với những người yêu sách nhé!',
          type: 'system',
          isRead: index % 2 === 0,
          sentAt: createdAt,
          actionUrl: '/books',
          createdAt,
          updatedAt: now,
        },
        {
          id: randomUUID(),
          userId: user.id,
          title: 'Theo dõi mới',
          message: `${actor.username} đã theo dõi bạn.`,
          type: 'follow',
          isRead: index % 3 === 0,
          sentAt: createdAt,
          actionUrl: `/users/${actor.id}`,
          meta: {
            actorId: actor.id,
            username: actor.username,
            ...(actor.image === null ? {} : { image: actor.image }),
          } satisfies Prisma.InputJsonObject,
          createdAt,
          updatedAt: now,
        },
      );
    }

    const result = await this.prisma.notification.createMany({
      data: notifications,
    });
    this.logger.log(`Seeded ${result.count} notification records`);
  }

  async clear(): Promise<void> {
    await this.prisma.notification.deleteMany();
  }
}
