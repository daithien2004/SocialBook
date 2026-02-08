
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from '../schemas/notification.schema';
import { NotificationRepository } from './repositories/notification.repository';
import { INotificationRepository } from '../domain/repositories/notification.repository.interface';

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
export class NotificationsInfrastructureModule {}
