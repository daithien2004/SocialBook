import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from '@/shared/platform/constants/event-names.constant';
import { UserRoleChangedEvent } from './events/user-role-changed.event';
import { UserRoleChangeOutboxPort } from './user-role-change-outbox.port';

@Injectable()
export class UserRoleChangeOutboxRelay
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(UserRoleChangeOutboxRelay.name);
  private timer: NodeJS.Timeout | undefined;
  private running = false;
  private relayInFlight: Promise<void> | undefined;

  constructor(
    private readonly outbox: UserRoleChangeOutboxPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      this.startRelay();
    }, 1000);
    this.timer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    await this.relayInFlight;
  }

  private startRelay(): void {
    if (this.relayInFlight) return;

    const operation = this.relay().catch((error: unknown) => {
      const detail = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`User role outbox poll failed: ${detail}`);
    });
    this.relayInFlight = operation;
    void operation.then(() => {
      if (this.relayInFlight === operation) {
        this.relayInFlight = undefined;
      }
    });
  }

  async relay(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const events = await this.outbox.claimBatch(25);
      for (const event of events) {
        try {
          await this.eventEmitter.emitAsync(
            EventNames.USER_ROLE_CHANGED,
            new UserRoleChangedEvent(event.userId, event.roleId),
          );
          await this.outbox.markPublished(event.id);
        } catch (error: unknown) {
          const attempt = Math.min(event.attempts, 8);
          await this.outbox.release(
            event.id,
            Math.min(1000 * 2 ** attempt, 300_000),
          );
          const detail =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to relay user role event ${event.id}: ${detail}`,
          );
          break;
        }
      }
    } finally {
      this.running = false;
    }
  }
}
