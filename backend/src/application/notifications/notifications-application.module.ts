import { Module } from '@nestjs/common';
import { CreateNotificationUseCase } from './use-cases/create-notification/create-notification.use-case';
import { GetUserNotificationsUseCase } from './use-cases/get-user-notification/get-user-notifications.use-case';
import { MarkNotificationReadUseCase } from './use-cases/mark-notification/mark-notification-read.use-case';
import { NotificationsRepositoryModule } from '@/infrastructure/database/repositories/notifications/notifications-repository.module';

@Module({
  imports: [
    NotificationsRepositoryModule,
  ],
  providers: [
    CreateNotificationUseCase,
    GetUserNotificationsUseCase,
    MarkNotificationReadUseCase,
  ],
  exports: [
    CreateNotificationUseCase,
    GetUserNotificationsUseCase,
    MarkNotificationReadUseCase,
  ],
})
export class NotificationsApplicationModule { }
