import { CommandBus } from '@nestjs/cqrs';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';

import { UpdateProgressCommand } from '@/application/library/commands/update-progress/update-progress.command';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import { RoomSocket } from './reading-room.types';
import { PROGRESS_FLUSH_DEBOUNCE_MS } from './reading-room.constants';

@Injectable()
export class ReadingProgressTracker {
  private readonly logger = new Logger(ReadingProgressTracker.name);

  constructor(
    @Inject('IChapterRepository') private readonly chapterRepository: IChapterRepository,
    private readonly commandBus: CommandBus,
  ) {}

  schedule(
    socket: RoomSocket,
    bookId: string,
    chapterId: string,
    progress: number,
  ): void {
    const sd = socket.data;
    sd.pendingProgress = {
      bookId,
      chapterId,
      progress,
    };

    sd.progressTimer ??= setTimeout(() => {
      this.flush(socket).catch((err: unknown) => {
        this.logger.error('Failed to flush progress', err);
      });
    }, PROGRESS_FLUSH_DEBOUNCE_MS);
  }

  async flush(socket: RoomSocket): Promise<void> {
    const sd = socket.data;
    if (sd.progressTimer) {
      clearTimeout(sd.progressTimer);
      sd.progressTimer = undefined;
    }

    const pending = sd.pendingProgress;
    if (pending && sd.userId) {
      sd.pendingProgress = undefined;
      await this.saveReadingProgress(
        socket,
        pending.bookId,
        pending.chapterId,
        pending.progress,
      ).catch((e) => this.logger.warn(`Flush progress error: ${e}`));
    }
  }

  private async saveReadingProgress(
    socket: RoomSocket,
    bookId: string,
    chapterId: string,
    progress: number,
  ): Promise<void> {
    const sd = socket.data;
    const { userId } = sd;

    sd.verifiedChapters ??= new Map<string, string>();
    if (sd.verifiedChapters.get(chapterId) !== bookId) {
      const chapter = await this.chapterRepository.findById(
        ChapterId.create(chapterId),
      );
      if (!chapter) {
        this.logger.warn(
          `Skip progress: chapter ${chapterId} not found (user ${userId}, book ${bookId})`,
        );
        return;
      }
      if (chapter.bookId.toString() !== bookId) {
        this.logger.warn(
          `Skip progress: chapter ${chapterId} does not belong to book ${bookId} (user ${userId})`,
        );
        return;
      }
      sd.verifiedChapters.set(chapterId, bookId);
    }

    try {
      await this.commandBus.execute(
        new UpdateProgressCommand(userId, bookId, chapterId, progress, true),
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to save reading progress for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
