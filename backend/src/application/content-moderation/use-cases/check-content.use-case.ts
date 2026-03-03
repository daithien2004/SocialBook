import { Injectable } from '@nestjs/common';
import { IContentModerationService } from '@/domain/content-moderation/interfaces/content-moderation.service.interface';
import { ModerationResult } from '@/domain/content-moderation/interfaces/moderation-result.interface';

@Injectable()
export class CheckContentUseCase {
  constructor(
    private readonly moderationService: IContentModerationService,
  ) {}

  async execute(text: string): Promise<ModerationResult> {
    return this.moderationService.checkContent(text);
  }
}

