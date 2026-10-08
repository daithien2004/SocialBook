import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IReadingProgressRepository } from '@/modules/library/domain/library/repositories/reading-progress.repository.interface';
import { UserId } from '@/modules/library/domain/library/value-objects/user-id.vo';
import { ChapterId } from '@/modules/library/domain/library/value-objects/chapter-id.vo';
import { ReadingProgress } from '@/modules/library/domain/library/entities/reading-progress.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { RecordReadingTimeCommand } from './record-reading-time.command';

export interface RecordReadingTimeResult {
  readingProgress: ReadingProgress;
  timeSpentMinutes: number;
}

@CommandHandler(RecordReadingTimeCommand)
export class RecordReadingTimeHandler implements ICommandHandler<
  RecordReadingTimeCommand,
  RecordReadingTimeResult
> {
  constructor(
    private readonly readingProgressRepository: IReadingProgressRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    command: RecordReadingTimeCommand,
  ): Promise<RecordReadingTimeResult> {
    const userIdVO = UserId.create(command.userId);
    const chapterId = ChapterId.create(command.chapterId);

    let readingProgress =
      await this.readingProgressRepository.findByUserIdAndChapterId(
        userIdVO,
        chapterId,
      );

    if (!readingProgress) {
      readingProgress = ReadingProgress.create({
        id: this.idGenerator.generate(),
        userId: command.userId,
        bookId: command.bookId,
        chapterId: command.chapterId,
        timeSpent: command.durationInSeconds,
      });
    } else {
      readingProgress.addTimeSpent(command.durationInSeconds);
    }

    await this.readingProgressRepository.save(readingProgress);

    const minutes = Math.ceil(command.durationInSeconds / 60);

    return {
      readingProgress,
      timeSpentMinutes: minutes,
    };
  }
}
