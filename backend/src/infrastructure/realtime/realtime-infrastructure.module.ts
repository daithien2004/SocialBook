import { Module } from '@nestjs/common';
import { RealtimeWorkerListener } from './realtime-worker.listener';
import { isWorkerProcess } from '@/common/utils/process-role.util';

@Module({
  providers: isWorkerProcess() ? [RealtimeWorkerListener] : [],
})
export class RealtimeInfrastructureModule {}
