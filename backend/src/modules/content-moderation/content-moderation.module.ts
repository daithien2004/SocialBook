import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContentModerationService } from './infrastructure/services/content-moderation.service';
import { CheckContentUseCase } from './application/use-cases/check-content.use-case';

import { IContentModerationService } from './domain/interfaces/content-moderation.service.interface';

@Module({
    imports: [ConfigModule],
    providers: [
        ContentModerationService,
        CheckContentUseCase,
        { provide: IContentModerationService, useClass: ContentModerationService },
    ],
    exports: [CheckContentUseCase, IContentModerationService],
})
export class ContentModerationModule { }
