import { Injectable, Logger } from '@nestjs/common';
import { IUserAnalyticsRepository } from '@/domain/analytics/repositories/user-analytics.repository.interface';
import { UserEventType } from '@/domain/analytics/enums/user-event-type.enum';

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  private readonly scoreMap: Record<string, number> = {
    [UserEventType.OPEN_BOOK]: 1,
    [UserEventType.READING_PROGRESS]: 5,
    [UserEventType.FINISH_CHAPTER]: 10,
    [UserEventType.FINISH_BOOK]: 30,
    [UserEventType.LIKE_BOOK]: 20,
    [UserEventType.BOOKMARK_BOOK]: 15,
    [UserEventType.SHARE_BOOK]: 40,
    [UserEventType.SKIP_BOOK]: -10,
    [UserEventType.SEARCH]: 2,
  };

  constructor(private readonly analyticsRepository: IUserAnalyticsRepository) {}

  async calculateScore(
    userId: string,
    eventType: string,
    genreIds: string[],
  ): Promise<void> {
    const score = this.scoreMap[eventType];
    if (!score || genreIds.length === 0) return;

    this.logger.log(
      `Updating scores for user ${userId}: ${eventType} (+${score}) for genres: ${genreIds.join(', ')}`,
    );

    await Promise.all(
      genreIds.map((genreId) =>
        this.analyticsRepository.updatePreferenceScore(userId, genreId, score),
      ),
    );
  }
}
