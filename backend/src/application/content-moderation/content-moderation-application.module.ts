import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { CheckContentHandler } from './commands/check-content/check-content.handler';
import { AddToxicWordHandler } from './commands/add-toxic-word/add-toxic-word.handler';
import { DeleteToxicWordHandler } from './commands/delete-toxic-word/delete-toxic-word.handler';
import { GetToxicWordsHandler } from './queries/get-toxic-words/get-toxic-words.handler';
import { RefreshToxicWordsListener } from './listeners/refresh-toxic-words.listener';
import { ContentModerationRepositoryModule } from '@/infrastructure/database/repositories/content-moderation/content-moderation-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { AIInfrastructureModule } from '@/infrastructure/ai/ai-infrastructure.module';
import { ContentModerationService } from './services/content-moderation.service';

@Module({
  imports: [
    CqrsModule,
    ContentModerationRepositoryModule,
    IdGeneratorModule,
    AIInfrastructureModule,
  ],
  providers: [
    CheckContentHandler,
    AddToxicWordHandler,
    DeleteToxicWordHandler,
    GetToxicWordsHandler,
    RefreshToxicWordsListener,
    ContentModerationService,
  ],
  exports: [
    CheckContentHandler,
    ContentModerationService,
    AddToxicWordHandler,
    DeleteToxicWordHandler,
    GetToxicWordsHandler,
  ],
})
export class ContentModerationApplicationModule {}
