import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUserAnalyticsRepository } from '@/domain/analytics/repositories/user-analytics.repository.interface';
import { UserEvent } from '@/domain/analytics/entities/user-event.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { TrackUserEventCommand } from '../use-cases/track-user-event/track-user-event.command';

@Processor('analytics')
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
        const command = job.data;
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

        await this.analyticsRepository.saveEvent(event);

        this.eventEmitter.emit('user-event.tracked', {
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
