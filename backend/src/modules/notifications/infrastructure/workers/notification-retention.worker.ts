import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/core/database/postgres/prisma.service';

const NOTIFICATION_RETENTION_DAYS = 30;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

@Injectable()
export class NotificationRetentionWorker {
  private readonly logger = new Logger(NotificationRetentionWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 3 * * *')
  async deleteExpiredNotifications(): Promise<void> {
    const expiresBefore = new Date(
      Date.now() - NOTIFICATION_RETENTION_DAYS * DAY_IN_MILLISECONDS,
    );
    const result = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: expiresBefore } },
    });

    if (result.count > 0) {
      this.logger.log(`Deleted ${String(result.count)} expired notifications`);
    }
  }
}
