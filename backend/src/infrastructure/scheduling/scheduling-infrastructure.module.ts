import { Module } from '@nestjs/common';
import { ReminderService } from './reminder.service';

@Module({
  providers: [ReminderService],
  exports: [ReminderService],
})
export class SchedulingInfrastructureModule {}
