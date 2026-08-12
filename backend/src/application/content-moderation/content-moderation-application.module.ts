import { Module } from '@nestjs/common';
import { CheckContentUseCase } from './use-cases/check-content.use-case';
import { AddToxicWordUseCase } from './use-cases/add-toxic-word.use-case';
import { DeleteToxicWordUseCase } from './use-cases/delete-toxic-word.use-case';
import { GetToxicWordsUseCase } from './use-cases/get-toxic-words.use-case';
import { RefreshToxicWordsListener } from './listeners/refresh-toxic-words.listener';
import { ContentModerationRepositoryModule } from '@/infrastructure/database/repositories/content-moderation/content-moderation-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { AIInfrastructureModule } from '@/infrastructure/ai/ai-infrastructure.module';
import { ContentModerationService } from './services/content-moderation.service';

@Module({
  imports: [
    ContentModerationRepositoryModule,
    IdGeneratorModule,
    AIInfrastructureModule,
  ],
  providers: [
    CheckContentUseCase,
    AddToxicWordUseCase,
    DeleteToxicWordUseCase,
    GetToxicWordsUseCase,
    RefreshToxicWordsListener,
    ContentModerationService,
  ],
  exports: [
    CheckContentUseCase,
    ContentModerationService,
    AddToxicWordUseCase,
    DeleteToxicWordUseCase,
    GetToxicWordsUseCase,
  ],
})
export class ContentModerationApplicationModule {}
