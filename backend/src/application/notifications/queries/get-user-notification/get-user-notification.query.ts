import { Query, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { INotificationRepository } from "@/domain/notifications/repositories/notification.repository.interface";
import { Notification } from "@/domain/notifications/entities/notification.entity";

export class GetUserNotificationsQuery extends Query<Notification[]> {
  constructor() { super(); }
}
