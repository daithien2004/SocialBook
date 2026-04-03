import { Injectable, Logger } from '@nestjs/common';
import {
  RecordReadingTimeUseCase,
  RecordReadingTimeResult,
} from '@/application/library/use-cases/record-reading-time/record-reading-time.use-case';
import { RecordReadingUseCase } from '@/application/gamification/use-cases/record-reading/record-reading.use-case';
import { ProcessReadingSessionCommand } from './process-reading-session.command';

export interface ProcessReadingSessionResult {
  timeSpentMinutes: number;
}

@Injectable()
export class ProcessReadingSessionUseCase {
  private readonly logger = new Logger(ProcessReadingSessionUseCase.name);

  constructor(
    private readonly recordReadingTimeUseCase: RecordReadingTimeUseCase,
    private readonly recordReadingUseCase: RecordReadingUseCase,
  ) {}

  async execute(
    command: ProcessReadingSessionCommand,
  ): Promise<ProcessReadingSessionResult> {
    try {
      const result = await this.recordReadingTimeUseCase.execute({
        userId: command.userId,
        bookId: command.bookId,
        chapterId: command.chapterId,
        durationInSeconds: command.durationInSeconds,
      } as any);

      if (result.timeSpentMinutes > 0) {
        await this.recordReadingUseCase.execute({
          userId: command.userId,
          xpAmount: Math.min(result.timeSpentMinutes, 50),
        });
      }

      this.logger.log(
        `Processed reading session for user ${command.userId}: ${result.timeSpentMinutes} minutes`,
      );

      return {
        timeSpentMinutes: result.timeSpentMinutes,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process reading session for user ${command.userId}`,
        error,
      );
      throw error;
    }
  }
}
