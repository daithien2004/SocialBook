import { CommandHandler } from '@nestjs/cqrs';
import { MarkNotificationReadCommand } from './mark-notification-read.command';
import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';

@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadHandler {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(command: MarkNotificationReadCommand): Promise<void> {
    await this.notificationRepository.markAsRead(
      command.userId,
      (command as any).id,
    );
  }
}
