import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';

@Module({
  imports: [
    EventEmitterModule.forRoot({ verboseMemoryLeak: true }),
    CqrsModule.forRoot(),
    ...(isWorkerProcess() ? [ScheduleModule.forRoot()] : []),
  ],
  exports: [EventEmitterModule, CqrsModule],
})
export class CoreRuntimeModule {}
