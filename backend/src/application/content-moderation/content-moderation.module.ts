import { Module } from '@nestjs/common';
import { CheckContentUseCase } from './use-cases/check-content.use-case';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

@Module({
  imports: [
    InfrastructureModule,
  ],
  providers: [
    CheckContentUseCase,
  ],
  exports: [
    CheckContentUseCase,
  ],
})
export class ContentModerationModule {}
