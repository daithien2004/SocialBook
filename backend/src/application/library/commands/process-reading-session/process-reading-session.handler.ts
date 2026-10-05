import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { RecordReadingTimeHandler } from '@/application/library/commands/record-reading-time/record-reading-time.handler';
import { ProcessReadingSessionCommand } from './process-reading-session.command';

export interface ProcessReadingSessionResult {
  timeSpentMinutes: number;
}

@CommandHandler(ProcessReadingSessionCommand)
export class ProcessReadingSessionHandler implements ICommandHandler<ProcessReadingSessionCommand, ProcessReadingSessionResult> {
  private readonly logger = new Logger(ProcessReadingSessionHandler.name);

  constructor(
    private readonly recordReadingTimeHandler: RecordReadingTimeHandler,
  ) {}

  async execute(
    command: ProcessReadingSessionCommand,
  ): Promise<ProcessReadingSessionResult> {
    try {
      const result = await this.recordReadingTimeHandler.execute(command as any);

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
