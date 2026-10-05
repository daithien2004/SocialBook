import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CreateNotificationHandler } from './commands/create-notification/create-notification.handler';
import { GetUserNotificationsHandler } from './queries/get-user-notification/get-user-notifications.handler';
import { MarkNotificationReadHandler } from './commands/mark-notification/mark-notification-read.handler';
import { MarkAllNotificationsReadHandler } from './commands/mark-notification/mark-all-notifications-read.handler';
import { NotificationsRepositoryModule } from '@/infrastructure/database/repositories/notifications/notifications-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [
    CqrsModule,NotificationsRepositoryModule, IdGeneratorModule],
  providers: [
    CreateNotificationHandler,
    GetUserNotificationsHandler,
    MarkNotificationReadHandler,
    MarkAllNotificationsReadHandler,
  ],
  exports: [
    CreateNotificationHandler,
    GetUserNotificationsHandler,
    MarkNotificationReadHandler,
    MarkAllNotificationsReadHandler,
  ],
})
export class NotificationsApplicationModule {}
