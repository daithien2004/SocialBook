import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { INotificationRepository } from '@/modules/notifications/domain/repositories/notification.repository.interface';
import { NotificationRepository } from './notification.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: INotificationRepository,
      useClass: NotificationRepository,
    },
  ],
  exports: [INotificationRepository],
})
export class NotificationsRepositoryModule {}
