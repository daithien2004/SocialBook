import { UserEventType } from '@/domain/analytics/enums/user-event-type.enum';

export class TrackUserEventCommand {
  constructor(
    public readonly userId: string,
    public readonly eventType: UserEventType,
    public readonly bookId?: string,
    public readonly chapterId?: string,
    public readonly durationSeconds?: number,
    public readonly progressPercent?: number,
    public readonly source?: string,
    public readonly deviceType?: string,
    public readonly metadata?: Record<string, unknown>,
    public readonly sessionId?: string,
  ) {}
}
