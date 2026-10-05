import { Command } from '@nestjs/cqrs';

export class TrackUserEventCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly eventType: string,
    public readonly bookId?: string,
    public readonly chapterId?: string,
    public readonly durationSeconds?: number,
    public readonly progressPercent?: number,
    public readonly source?: string,
    public readonly deviceType?: string,
    public readonly metadata?: Record<string, unknown>,
    public readonly sessionId?: string,
  ) { super(); }
}
