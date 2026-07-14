import { Module } from '@nestjs/common';
import { CreateNotificationUseCase } from './use-cases/create-notification/create-notification.use-case';
import { GetUserNotificationsUseCase } from './use-cases/get-user-notification/get-user-notifications.use-case';
import { MarkNotificationReadUseCase } from './use-cases/mark-notification/mark-notification-read.use-case';
import { MarkAllNotificationsReadUseCase } from './use-cases/mark-notification/mark-all-notifications-read.use-case';
import { NotificationsRepositoryModule } from '@/infrastructure/database/repositories/notifications/notifications-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [NotificationsRepositoryModule, IdGeneratorModule],
  providers: [
    CreateNotificationUseCase,
    GetUserNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
  ],
  exports: [
    CreateNotificationUseCase,
    GetUserNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
  ],
})
export class NotificationsApplicationModule {}
