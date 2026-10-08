import { CommandBus } from '@nestjs/cqrs';
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { UpdateProgressCommand } from '@/modules/library/application/public-api';
import { RoomSocket } from './reading-room.types';
import { PROGRESS_FLUSH_INTERVAL_MS } from './reading-room.constants';

interface ProgressState {
  pending?: { bookId: string; chapterId: string; progress: number };
  timer?: NodeJS.Timeout;
  lastSaved?: string;
}

@Injectable()
export class ReadingProgressTracker implements OnApplicationShutdown {
  private readonly logger = new Logger(ReadingProgressTracker.name);
  private readonly states = new Map<string, ProgressState>();
  private readonly sockets = new Map<string, RoomSocket>();

  constructor(private readonly commandBus: CommandBus) {}

  schedule(
    socket: RoomSocket,
    bookId: string,
    chapterId: string,
    progress: number,
  ): void {
    const key = `${bookId}:${chapterId}:${progress.toString()}`;
    const state = this.states.get(socket.id) ?? {};
    if (state.lastSaved === key && !state.pending) return; // không đổi

    state.pending = { bookId, chapterId, progress };
    state.timer ??= setTimeout(
      () => void this.flush(socket),
      PROGRESS_FLUSH_INTERVAL_MS,
    );
    this.states.set(socket.id, state);
    this.sockets.set(socket.id, socket);
  }

  async flush(socket: RoomSocket): Promise<void> {
    const state = this.states.get(socket.id);
    if (!state) return;
    if (state.timer) clearTimeout(state.timer);
    state.timer = undefined;

    const p = state.pending;
    state.pending = undefined;
    const userId = socket.data.userId;
    if (!p || !userId) return;

    const ok = await this.save(userId, p);
    if (ok)
      state.lastSaved = `${p.bookId}:${p.chapterId}:${p.progress.toString()}`;
  }

  async dispose(socket: RoomSocket): Promise<void> {
    await this.flush(socket);
    this.states.delete(socket.id);
    this.sockets.delete(socket.id);
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.allSettled(
      [...this.sockets.values()].map((s) => this.flush(s)),
    );
  }

  private async save(
    userId: string,
    p: { bookId: string; chapterId: string; progress: number },
  ): Promise<boolean> {
    try {
      await this.commandBus.execute(
        new UpdateProgressCommand(
          userId,
          p.bookId,
          p.chapterId,
          p.progress,
          true,
        ),
      );
      return true;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to save reading progress for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
