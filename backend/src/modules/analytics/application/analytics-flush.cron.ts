import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { IUserAnalyticsRepository } from '@/modules/analytics/domain/repositories/user-analytics.repository.interface';
import { UserEvent } from '@/modules/analytics/domain/entities/user-event.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { isWorkerProcess } from '@/common/utils/process-role.util';
import { TrackEventPayloadSchema } from '@/shared/queue/job-payload.schemas';
import { UserEventType } from '@/modules/analytics/domain/enums/user-event-type.enum';
import { EventNames } from '@/common/constants/event-names.constant';

@Injectable()
export class AnalyticsFlushCron {
  private readonly logger = new Logger(AnalyticsFlushCron.name);
  private readonly BUFFER_KEY = 'analytics:events:buffer';

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly analyticsRepository: IUserAnalyticsRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async flushEvents() {
    if (!isWorkerProcess()) {
      return;
    }

    try {
      // Dùng transaction (multi/exec) để lấy toàn bộ List ra và xóa List atomic
      const [results] =
        (await this.redis
          .multi()
          .lrange(this.BUFFER_KEY, 0, -1)
          .del(this.BUFFER_KEY)
          .exec()) || [];

      const lrangeResult = results[1];
      const rawEvents: string[] = Array.isArray(lrangeResult)
        ? lrangeResult.map(String)
        : [];

      if (rawEvents.length === 0) {
        return;
      }

      this.logger.log(
        `Flushing ${String(rawEvents.length)} analytics events to MongoDB...`,
      );

      const entitiesToInsert: UserEvent[] = [];

      for (const raw of rawEvents) {
        try {
          const parsedCommand: unknown = JSON.parse(raw);
          const parsed = TrackEventPayloadSchema.safeParse(parsedCommand);
          if (!parsed.success) {
            this.logger.warn(
              `Invalid event in buffer: ${parsed.error.message}`,
            );
            continue;
          }
          const command = parsed.data;

          const isUserEventType = (val: string): val is UserEventType =>
            Object.values(UserEventType).map(String).includes(val);

          if (!isUserEventType(command.eventType)) {
            this.logger.warn(
              `Invalid event type in buffer: ${command.eventType}`,
            );
            continue;
          }

          const event = UserEvent.create({
            id: this.idGenerator.generate(),
            userId: command.userId,
            eventType: command.eventType,
            bookId: command.bookId,
            chapterId: command.chapterId,
            durationSeconds: command.durationSeconds,
            progressPercent: command.progressPercent,
            source: command.source,
            deviceType: command.deviceType,
            metadata: command.metadata,
            sessionId: command.sessionId,
          });

          entitiesToInsert.push(event);

          // Phát ra event nội bộ cho các listener khác (như cập nhật preference, stats)
          this.eventEmitter.emit(EventNames.USER_EVENT_TRACKED, {
            userId: command.userId,
            event,
          });
        } catch (e) {
          this.logger.error('Failed to parse analytics event from buffer', e);
        }
      }

      if (entitiesToInsert.length > 0) {
        await this.analyticsRepository.insertManyEvents(entitiesToInsert);
        this.logger.log(
          `Successfully flushed ${String(entitiesToInsert.length)} events.`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to flush analytics events from Redis to MongoDB',
        error,
      );
    }
  }
}
