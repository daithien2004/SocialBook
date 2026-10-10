import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from '@/shared/platform/constants/event-names.constant';
import {
  UserRoleChangeOutboxEvent,
  UserRoleChangeOutboxPort,
} from '@/modules/users/application/users/user-role-change-outbox.port';
import { UserRoleChangeOutboxRelay } from '@/modules/users/application/users/user-role-change-outbox-relay';
import { UserRoleChangedEvent } from '@/modules/users/application/users/events/user-role-changed.event';

class InMemoryUserRoleOutbox extends UserRoleChangeOutboxPort {
  events: UserRoleChangeOutboxEvent[] = [];
  readonly published: string[] = [];
  readonly released: Array<{ id: string; retryDelayMs: number }> = [];

  append(event: Omit<UserRoleChangeOutboxEvent, 'attempts'>): Promise<void> {
    this.events.push({ ...event, attempts: 0 });
    return Promise.resolve();
  }

  claimBatch(): Promise<UserRoleChangeOutboxEvent[]> {
    this.events = this.events.map((event) => ({
      ...event,
      attempts: event.attempts + 1,
    }));
    return Promise.resolve(this.events);
  }

  markPublished(eventId: string): Promise<void> {
    this.published.push(eventId);
    return Promise.resolve();
  }

  release(eventId: string, retryDelayMs: number): Promise<void> {
    this.released.push({ id: eventId, retryDelayMs });
    return Promise.resolve();
  }
}

class DeferredUserRoleOutbox extends InMemoryUserRoleOutbox {
  private resolveClaim: (() => void) | undefined;
  claims = 0;

  override claimBatch(): Promise<UserRoleChangeOutboxEvent[]> {
    this.claims += 1;
    return new Promise((resolve) => {
      this.resolveClaim = () => {
        resolve([]);
      };
    });
  }

  finishClaim(): void {
    this.resolveClaim?.();
  }
}

describe('UserRoleChangeOutboxRelay', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('emits the event and marks it published', async () => {
    const outbox = new InMemoryUserRoleOutbox();
    await outbox.append({ id: 'event-1', userId: 'user-1', roleId: 'role-1' });
    const emitter = new EventEmitter2();
    const received: UserRoleChangedEvent[] = [];
    emitter.on(EventNames.USER_ROLE_CHANGED, (event: UserRoleChangedEvent) => {
      received.push(event);
    });
    const relay = new UserRoleChangeOutboxRelay(outbox, emitter);

    await relay.relay();

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(new UserRoleChangedEvent('user-1', 'role-1'));
    expect(outbox.published).toEqual(['event-1']);
    expect(outbox.released).toHaveLength(0);
  });

  it('releases the event for retry when a consumer fails', async () => {
    const outbox = new InMemoryUserRoleOutbox();
    await outbox.append({ id: 'event-2', userId: 'user-2', roleId: 'role-2' });
    const emitter = new EventEmitter2();
    emitter.on(EventNames.USER_ROLE_CHANGED, () => {
      throw new Error('consumer unavailable');
    });
    const relay = new UserRoleChangeOutboxRelay(outbox, emitter);

    await relay.relay();

    expect(outbox.published).toHaveLength(0);
    expect(outbox.released).toEqual([{ id: 'event-2', retryDelayMs: 2000 }]);
  });

  it('stops polling and waits for an active batch during shutdown', async () => {
    jest.useFakeTimers();
    const outbox = new DeferredUserRoleOutbox();
    const relay = new UserRoleChangeOutboxRelay(outbox, new EventEmitter2());
    relay.onModuleInit();

    jest.advanceTimersByTime(1000);
    expect(outbox.claims).toBe(1);

    let shutdownFinished = false;
    const shutdown = relay.onModuleDestroy().then(() => {
      shutdownFinished = true;
    });

    await Promise.resolve();
    expect(shutdownFinished).toBe(false);

    outbox.finishClaim();
    await shutdown;

    expect(shutdownFinished).toBe(true);
    jest.advanceTimersByTime(5000);
    expect(outbox.claims).toBe(1);
  });
});
