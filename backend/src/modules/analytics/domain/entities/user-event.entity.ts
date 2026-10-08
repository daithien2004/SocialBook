import { Entity } from '@/shared/domain/entity.base';
import { UserEventType } from '../enums/user-event-type.enum';

export interface UserEventProps {
  userId: string;
  sessionId?: string;
  eventType: UserEventType;
  bookId?: string;
  chapterId?: string;
  durationSeconds?: number;
  progressPercent?: number;
  source?: string;
  deviceType?: string;
  metadata?: Record<string, unknown>;
}

export class UserEvent extends Entity<string> {
  private _props: UserEventProps;

  private constructor(
    id: string,
    props: UserEventProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: UserEventProps & { id: string }): UserEvent {
    return new UserEvent(props.id, {
      ...props,
      durationSeconds: props.durationSeconds || 0,
      metadata: props.metadata || {},
    });
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    sessionId?: string;
    eventType: UserEventType;
    bookId?: string;
    chapterId?: string;
    durationSeconds?: number;
    progressPercent?: number;
    source?: string;
    deviceType?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  }): UserEvent {
    const { id, createdAt, updatedAt, ...rest } = props;
    return new UserEvent(id, rest, createdAt, updatedAt);
  }

  get userId(): string {
    return this._props.userId;
  }
  get sessionId(): string | undefined {
    return this._props.sessionId;
  }
  get eventType(): UserEventType {
    return this._props.eventType;
  }
  get bookId(): string | undefined {
    return this._props.bookId;
  }
  get chapterId(): string | undefined {
    return this._props.chapterId;
  }
  get durationSeconds(): number | undefined {
    return this._props.durationSeconds;
  }
  get progressPercent(): number | undefined {
    return this._props.progressPercent;
  }
  get source(): string | undefined {
    return this._props.source;
  }
  get deviceType(): string | undefined {
    return this._props.deviceType;
  }
  get metadata(): Record<string, unknown> | undefined {
    return this._props.metadata;
  }
}
