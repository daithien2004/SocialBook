import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MarkAllNotificationsReadCommand } from './mark-all-notifications-read.command';
import { INotificationRepository } from '@/modules/notifications/domain/repositories/notification.repository.interface';
import { subject } from '@casl/ability';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(MarkAllNotificationsReadCommand)
export class MarkAllNotificationsReadHandler implements ICommandHandler<MarkAllNotificationsReadCommand> {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  @Transactional()
  async execute(command: MarkAllNotificationsReadCommand): Promise<void> {
    if (
      !command.actor.ability.can(
        'update',
        subject('Notification', { id: '', userId: command.actor.userId }),
      )
    ) {
      throw new ForbiddenDomainException('NOTIFICATION_UPDATE_FORBIDDEN');
    }
    await this.notificationRepository.markAllAsRead(command.actor.userId);
  }
}
