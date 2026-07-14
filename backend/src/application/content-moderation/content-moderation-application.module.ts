import { Module } from '@nestjs/common';
import { CheckContentUseCase } from './use-cases/check-content.use-case';
import { AddToxicWordUseCase } from './use-cases/add-toxic-word.use-case';
import { DeleteToxicWordUseCase } from './use-cases/delete-toxic-word.use-case';
import { GetToxicWordsUseCase } from './use-cases/get-toxic-words.use-case';
import { RefreshToxicWordsListener } from './listeners/refresh-toxic-words.listener';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CheckContentUseCase,
    AddToxicWordUseCase,
    DeleteToxicWordUseCase,
    GetToxicWordsUseCase,
    RefreshToxicWordsListener,
  ],
  exports: [
    CheckContentUseCase,
    AddToxicWordUseCase,
    DeleteToxicWordUseCase,
    GetToxicWordsUseCase,
  ],
})
export class ContentModerationApplicationModule {}
