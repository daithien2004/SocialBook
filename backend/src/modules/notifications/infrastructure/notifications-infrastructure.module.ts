import { Module } from '@nestjs/common';
import { NotificationsRepositoryModule } from './repositories/notifications-repository.module';

@Module({
  imports: [NotificationsRepositoryModule],
  exports: [NotificationsRepositoryModule],
})
export class NotificationsInfrastructureModule {}
