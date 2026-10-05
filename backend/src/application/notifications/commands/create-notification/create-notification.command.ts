import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { INotificationRepository } from "@/domain/notifications/repositories/notification.repository.interface";
import { Notification } from "@/domain/notifications/entities/notification.entity";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";

export class CreateNotificationCommand extends Command<Notification> {
  constructor(
    public readonly userId: string,
    public readonly title: string,
    public readonly message: string,
    public readonly type: string,
    public readonly meta?: Record<string, any>,
    public readonly actionUrl?: string,
  ) { super(); }
}
