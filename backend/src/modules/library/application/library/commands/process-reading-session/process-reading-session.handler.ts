import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { RecordReadingTimeCommand } from '@/modules/library/application/library/commands/record-reading-time/record-reading-time.command';
import { ProcessReadingSessionCommand } from './process-reading-session.command';
import { assertLibraryAccess } from '@/modules/library/application/policies/library-access.policy';

export interface ProcessReadingSessionResult {
  timeSpentMinutes: number;
}

@CommandHandler(ProcessReadingSessionCommand)
export class ProcessReadingSessionHandler implements ICommandHandler<
  ProcessReadingSessionCommand,
  ProcessReadingSessionResult
> {
  private readonly logger = new Logger(ProcessReadingSessionHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    command: ProcessReadingSessionCommand,
  ): Promise<ProcessReadingSessionResult> {
    assertLibraryAccess(command.actor, 'manage', command.userId);
    try {
      const result = await this.commandBus.execute(
        new RecordReadingTimeCommand(
          command.actor,
          command.userId,
          command.bookId,
          command.chapterId,
          command.durationInSeconds,
        ),
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
