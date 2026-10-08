import { CheckContentCommand } from './check-content.command';
import { CommandHandler } from '@nestjs/cqrs';
import { ContentModerationService } from '@/modules/content-moderation/application/services/content-moderation.service';
import { ModerationResult } from '@/modules/content-moderation/domain/interfaces/moderation-result.interface';

@CommandHandler(CheckContentCommand)
export class CheckContentHandler {
  constructor(private readonly moderationService: ContentModerationService) {}

  async execute(text: string): Promise<ModerationResult> {
    return this.moderationService.checkContent(text);
  }
}
