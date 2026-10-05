import { CreateNotificationCommand } from './create-notification.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';
import { Notification } from '@/domain/notifications/entities/notification.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

@CommandHandler(CreateNotificationCommand)
export class CreateNotificationHandler {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: CreateNotificationCommand): Promise<Notification> {
    const notification = Notification.create({
      id: this.idGenerator.generate(),
      userId: command.userId,
      title: command.title,
      message: command.message,
      type: command.type,
      meta: command.meta,
      actionUrl: command.actionUrl,
    });
    return this.notificationRepository.save(notification);
  }
}
