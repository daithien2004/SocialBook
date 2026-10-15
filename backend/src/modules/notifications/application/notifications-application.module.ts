import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CreateNotificationHandler } from './commands/create-notification/create-notification.handler';
import { GetUserNotificationsHandler } from './queries/get-user-notification/get-user-notifications.handler';
import { MarkNotificationReadHandler } from './commands/mark-notification/mark-notification-read.handler';
import { MarkAllNotificationsReadHandler } from './commands/mark-notification/mark-all-notifications-read.handler';
import { NotificationsInfrastructureModule } from '../infrastructure/notifications-infrastructure.module';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { GetNotificationByIdHandler } from './queries/get-notification-by-id/get-notification-by-id.handler';

@Module({
  imports: [CqrsModule, NotificationsInfrastructureModule, IdGeneratorModule],
  providers: [
    CreateNotificationHandler,
    GetUserNotificationsHandler,
    GetNotificationByIdHandler,
    MarkNotificationReadHandler,
    MarkAllNotificationsReadHandler,
  ],
})
export class NotificationsApplicationModule {}
