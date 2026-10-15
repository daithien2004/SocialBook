import { CreateNotificationCommand } from './create-notification.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { INotificationRepository } from '@/modules/notifications/domain/repositories/notification.repository.interface';
import { Notification } from '@/modules/notifications/domain/entities/notification.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { NotificationResultMapper } from '@/modules/notifications/application/notification.result';
import { EventNames } from '@/shared/platform/constants/event-names.constant';
import { Transactional } from '@nestjs-cls/transactional';
import type { NotificationResult } from '@/modules/notifications/application/notification.result';

@CommandHandler(CreateNotificationCommand)
export class CreateNotificationHandler implements ICommandHandler<CreateNotificationCommand> {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: CreateNotificationCommand): Promise<string> {
    if (!command.actor.ability.can('create', 'Notification')) {
      throw new ForbiddenDomainException('NOTIFICATION_CREATE_FORBIDDEN');
    }
    const result = await this.createNotification(command);
    this.eventEmitter.emit(EventNames.NOTIFICATION_CREATED, result);
    return result.id;
  }

  @Transactional()
  private async createNotification(
    command: CreateNotificationCommand,
  ): Promise<NotificationResult> {
    const notification = Notification.create({
      id: this.idGenerator.generate(),
      userId: command.userId,
      title: command.title,
      message: command.message,
      type: command.type,
      meta: command.meta,
      actionUrl: command.actionUrl,
    });
    const saved = await this.notificationRepository.save(notification);
    return NotificationResultMapper.fromDomain(saved);
  }
}
