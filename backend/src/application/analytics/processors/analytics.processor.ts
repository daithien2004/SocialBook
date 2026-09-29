import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUserAnalyticsRepository } from '@/domain/analytics/repositories/user-analytics.repository.interface';
import { UserEvent } from '@/domain/analytics/entities/user-event.entity';
import { UserEventType } from '@/domain/analytics/enums/user-event-type.enum';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { TrackUserEventCommand } from '../use-cases/track-user-event/track-user-event.command';
import { TrackEventPayloadSchema } from '@/shared/queue/job-payload.schemas';
import { EventNames } from '@/common/constants/event-names.constant';

@Processor('analytics', {
  // concurrency: 20 — analytics chỉ ghi DB, không gọi API ngoài.
  // DB chịu được nhiều write song song nên tăng để xử lý high-frequency events.
  concurrency: 20,
})
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(
    private readonly analyticsRepository: IUserAnalyticsRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<TrackUserEventCommand, void, string>): Promise<void> {
    if (job.name === 'track-event') {
      try {
        const parsed = TrackEventPayloadSchema.safeParse(job.data);
        if (!parsed.success) {
          throw new UnrecoverableError(
            `Invalid track-event payload: ${parsed.error.message}`,
          );
        }
        const command = parsed.data;
        const event = UserEvent.create({
          id: this.idGenerator.generate(),
          userId: command.userId,
          eventType: command.eventType as UserEventType,
          bookId: command.bookId,
          chapterId: command.chapterId,
          durationSeconds: command.durationSeconds,
          progressPercent: command.progressPercent,
          source: command.source,
          deviceType: command.deviceType,
          metadata: command.metadata,
          sessionId: command.sessionId,
        });

        await this.analyticsRepository.saveEvent(event);

        this.eventEmitter.emit(EventNames.USER_EVENT_TRACKED, {
          userId: command.userId,
          event,
        });
      } catch (error) {
        this.logger.error(`Failed to process track-event job ${job.id}`, error);
        throw error;
      }
    }
  }
}
