import { Injectable } from '@nestjs/common';
import { ContentModerationService } from '@/application/content-moderation/services/content-moderation.service';
import { ModerationResult } from '@/domain/content-moderation/interfaces/moderation-result.interface';

@Injectable()
export class CheckContentUseCase {
  constructor(private readonly moderationService: ContentModerationService) {}

  async execute(text: string): Promise<ModerationResult> {
    return this.moderationService.checkContent(text);
  }
}
