import { Module } from '@nestjs/common';
import { ContentModerationApplicationModule } from './application/content-moderation-application.module';
import { AdminToxicWordsController } from './presentation/admin-toxic-words.controller';

@Module({
  imports: [ContentModerationApplicationModule],
  controllers: [AdminToxicWordsController],
})
export class ContentModerationModule {}
