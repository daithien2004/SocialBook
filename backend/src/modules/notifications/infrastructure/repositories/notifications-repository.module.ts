import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { INotificationRepository } from '@/modules/notifications/domain/repositories/notification.repository.interface';
import { NotificationRepository } from './notification.repository';
import { NotificationReadRepository } from '../../application/ports/notification-read.repository';
import { PrismaNotificationReadRepository } from './notification-read.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    {
      provide: INotificationRepository,
      useClass: NotificationRepository,
    },
    {
      provide: NotificationReadRepository,
      useClass: PrismaNotificationReadRepository,
    },
  ],
  exports: [INotificationRepository, NotificationReadRepository],
})
export class NotificationsRepositoryModule {}
