import { Module } from '@nestjs/common';
import { AIApplicationModule } from './application/ai-application.module';
import { AIController } from './presentation/ai.controller';

@Module({
  imports: [AIApplicationModule],
  controllers: [AIController],
})
export class AIModule {}
