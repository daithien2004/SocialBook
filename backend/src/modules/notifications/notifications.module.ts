import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './infrastructure/services/notifications.service';
import { ReminderService } from './infrastructure/services/reminder.service';
import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { GetUserNotificationsUseCase } from './application/use-cases/get-user-notifications.use-case';
import { MarkNotificationReadUseCase } from './application/use-cases/mark-notification-read.use-case';
import { NotificationsInfrastructureModule } from './infrastructure/notifications.infrastructure.module';

@Module({
  imports: [
    NotificationsInfrastructureModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  providers: [
    NotificationsGateway, 
    NotificationsService, 
    ReminderService,
    CreateNotificationUseCase,
    GetUserNotificationsUseCase,
    MarkNotificationReadUseCase,
  ],
  exports: [NotificationsService, ReminderService],
})
export class NotificationsModule {}
