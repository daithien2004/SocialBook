import { Module } from '@nestjs/common';
import { ContentModerationService } from './content-moderation.service';

@Module({
    providers: [ContentModerationService],
    exports: [ContentModerationService],
})
export class ContentModerationModule { }
