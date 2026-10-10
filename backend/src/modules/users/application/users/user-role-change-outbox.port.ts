export interface UserRoleChangeOutboxEvent {
  id: string;
  userId: string;
  roleId: string;
  attempts: number;
}

export abstract class UserRoleChangeOutboxPort {
  abstract append(
    event: Omit<UserRoleChangeOutboxEvent, 'attempts'>,
  ): Promise<void>;
  abstract claimBatch(limit: number): Promise<UserRoleChangeOutboxEvent[]>;
  abstract markPublished(eventId: string): Promise<void>;
  abstract release(eventId: string, retryDelayMs: number): Promise<void>;
}
