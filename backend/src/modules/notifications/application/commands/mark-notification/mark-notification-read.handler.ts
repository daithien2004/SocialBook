import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MarkNotificationReadCommand } from './mark-notification-read.command';
import { INotificationRepository } from '@/modules/notifications/domain/repositories/notification.repository.interface';
import { subject } from '@casl/ability';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadHandler implements ICommandHandler<MarkNotificationReadCommand> {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  @Transactional()
  async execute(command: MarkNotificationReadCommand): Promise<void> {
    if (
      !command.actor.ability.can(
        'update',
        subject('Notification', {
          id: command.id,
          userId: command.actor.userId,
        }),
      )
    ) {
      throw new ForbiddenDomainException('NOTIFICATION_UPDATE_FORBIDDEN');
    }
    await this.notificationRepository.markAsRead(
      command.actor.userId,
      command.id,
    );
  }
}
