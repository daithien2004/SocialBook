import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUserAnalyticsRepository } from '@/domain/analytics/repositories/user-analytics.repository.interface';
import { UserEvent } from '@/domain/analytics/entities/user-event.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { TrackUserEventCommand } from './track-user-event.command';

@Injectable()
export class TrackUserEventUseCase {
  constructor(
    private readonly analyticsRepository: IUserAnalyticsRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: TrackUserEventCommand): Promise<void> {
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
  }
}
