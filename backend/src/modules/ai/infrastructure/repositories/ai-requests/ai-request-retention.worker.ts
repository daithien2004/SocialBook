import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/core/database/postgres/prisma.service';

const AI_REQUEST_RETENTION_DAYS = 90;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

@Injectable()
export class AIRequestRetentionWorker {
  private readonly logger = new Logger(AIRequestRetentionWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 4 * * *')
  async deleteExpiredRequests(): Promise<void> {
    const expiresBefore = new Date(
      Date.now() - AI_REQUEST_RETENTION_DAYS * DAY_IN_MILLISECONDS,
    );
    const result = await this.prisma.aIRequest.deleteMany({
      where: { createdAt: { lt: expiresBefore } },
    });

    if (result.count > 0) {
      this.logger.log(`Deleted ${String(result.count)} expired AI requests`);
    }
  }
}
