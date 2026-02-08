import { ModerationResult } from './moderation-result.interface';

export abstract class IContentModerationService {
    abstract checkContent(text: string): Promise<ModerationResult>;
}
