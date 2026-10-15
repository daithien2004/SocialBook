import { TrackUserEventCommand } from './track-user-event.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ForbiddenError } from '@casl/ability';
import { AnalyticsEventBufferPort } from '../../ports/analytics-event-buffer.port';

@CommandHandler(TrackUserEventCommand)
export class TrackUserEventHandler implements ICommandHandler<TrackUserEventCommand> {
  private readonly logger = new Logger(TrackUserEventHandler.name);

  constructor(private readonly eventBuffer: AnalyticsEventBufferPort) {}

  async execute(command: TrackUserEventCommand): Promise<void> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'Analytics',
    );
    try {
      await this.eventBuffer.append({
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
    } catch (error) {
      this.logger.error('Failed to buffer analytics event in Redis', error);
    }
  }
}
