import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsApplicationModule } from '../../application/notifications-application.module';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineNotificationAbilities } from '../../application/policies/notification.ability';

@Module({
  imports: [
    NotificationsApplicationModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('env.JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  providers: [
    NotificationsGateway,
    NotificationsService,
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineNotificationAbilities]),
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsRealtimeModule {}
