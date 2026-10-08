import { Module } from '@nestjs/common';
import { RealtimeWorkerListener } from './realtime-worker.listener';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';

@Module({
  providers: isWorkerProcess() ? [RealtimeWorkerListener] : [],
})
export class RealtimeInfrastructureModule {}
