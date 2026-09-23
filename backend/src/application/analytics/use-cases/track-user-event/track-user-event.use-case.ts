import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TrackUserEventCommand } from './track-user-event.command';

@Injectable()
export class TrackUserEventUseCase {
  constructor(
    @InjectQueue('analytics') private readonly analyticsQueue: Queue,
  ) {}

  async execute(command: TrackUserEventCommand): Promise<void> {
    await this.analyticsQueue.add('track-event', command, {
      removeOnComplete: true,
      removeOnFail: 100, // Keep last 100 failed jobs
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
