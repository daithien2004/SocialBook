import { QueryHandler } from '@nestjs/cqrs';
import { GetUserNotificationsQuery } from './get-user-notifications.query';
import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';
import { Notification } from '@/domain/notifications/entities/notification.entity';

@QueryHandler(GetUserNotificationsQuery)
export class GetUserNotificationsHandler {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(query: GetUserNotificationsQuery): Promise<Notification[]> {
    const offset = ((query as any).page - 1) * (query as any).limit;
    return this.notificationRepository.findAllByUser(
      (query as any).userId,
      (query as any).limit,
      offset,
      (query as any).isRead,
    );
  }
}
