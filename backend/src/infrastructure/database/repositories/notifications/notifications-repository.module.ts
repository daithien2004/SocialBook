import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from '@/infrastructure/database/schemas/notification.schema';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';
import { NotificationRepository } from './notification.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
  ],
  providers: [
    {
      provide: INotificationRepository,
      useClass: NotificationRepository,
    },
  ],
  exports: [
    INotificationRepository,
    MongooseModule,
  ],
})
export class NotificationsRepositoryModule {}
