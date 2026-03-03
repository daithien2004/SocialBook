import { NotificationsApplicationModule } from '@/application/notifications/notifications-application.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from '../external/notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@Module({
    imports: [
        NotificationsApplicationModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('env.JWT_ACCESS_SECRET'),
            }),
        }),
    ],
    providers: [NotificationsGateway, NotificationsService],
    exports: [NotificationsService],
})
export class GatewaysModule { }
