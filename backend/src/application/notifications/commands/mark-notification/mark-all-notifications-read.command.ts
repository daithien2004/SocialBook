import { Command, CommandHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { INotificationRepository } from "@/domain/notifications/repositories/notification.repository.interface";

export class MarkAllNotificationsReadCommand extends Command<void> {
  constructor(
    public readonly userId: string,
  ) { super(); }
}
