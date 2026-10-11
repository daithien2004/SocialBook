import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController, AppController],
  providers: [AppService],
})
export class HealthModule {}
