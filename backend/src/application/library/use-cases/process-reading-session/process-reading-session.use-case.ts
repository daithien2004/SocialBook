import { Injectable, Logger } from '@nestjs/common';
import { RecordReadingTimeUseCase } from '@/application/library/use-cases/record-reading-time/record-reading-time.use-case';
import { ProcessReadingSessionCommand } from './process-reading-session.command';
import { RecordReadingTimeCommand } from '@/application/library/use-cases/record-reading-time/record-reading-time.command';

export interface ProcessReadingSessionResult {
  timeSpentMinutes: number;
}

@Injectable()
export class ProcessReadingSessionUseCase {
  private readonly logger = new Logger(ProcessReadingSessionUseCase.name);

  constructor(
    private readonly recordReadingTimeUseCase: RecordReadingTimeUseCase,
  ) {}

  async execute(
    command: ProcessReadingSessionCommand,
  ): Promise<ProcessReadingSessionResult> {
    try {
      const result = await this.recordReadingTimeUseCase.execute(
        command as RecordReadingTimeCommand,
      );

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
