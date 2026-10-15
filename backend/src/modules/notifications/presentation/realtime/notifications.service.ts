import { Injectable } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { OnEvent } from '@nestjs/event-emitter';
import { Server } from 'socket.io';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { EventNames } from '@/shared/platform/constants/event-names.constant';
import { GetUserNotificationsQuery } from '../../application/queries/get-user-notification/get-user-notifications.query';
import { MarkNotificationReadCommand } from '../../application/commands/mark-notification/mark-notification-read.command';
import { MarkAllNotificationsReadCommand } from '../../application/commands/mark-notification/mark-all-notifications-read.command';
import type { NotificationResult } from '../../application/notification.result';
import { NotificationResponseDto } from '../dto/notification.response.dto';

@Injectable()
export class NotificationsService {
  private server: Server | null = null;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  setServer(server: Server): void {
    this.server = server;
  }

  private actorFor(userId: string) {
    return this.abilityFactory.createActor({ userId, roles: [] });
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  async findAllByUser(userId: string, limit = 50) {
    const actor = this.actorFor(userId);
    const page = await this.queryBus.execute(
      new GetUserNotificationsQuery(actor, 1, limit),
    );
    return NotificationResponseDto.fromArray(page.items);
  }

  async markRead(userId: string, id: string): Promise<void> {
    const actor = this.actorFor(userId);
    await this.commandBus.execute(new MarkNotificationReadCommand(actor, id));
    this.server?.to(this.userRoom(userId)).emit('notification:read', { id });
  }

  async markAllRead(userId: string): Promise<void> {
    const actor = this.actorFor(userId);
    await this.commandBus.execute(new MarkAllNotificationsReadCommand(actor));
    this.server?.to(this.userRoom(userId)).emit('notification:readAll');
  }

  @OnEvent(EventNames.NOTIFICATION_CREATED)
  handleNotificationCreated(result: NotificationResult): void {
    this.server
      ?.to(this.userRoom(result.userId))
      .emit('notification:new', NotificationResponseDto.fromResult(result));
  }
}
