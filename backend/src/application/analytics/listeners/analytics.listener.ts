import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEventType } from '@/domain/analytics/enums/user-event-type.enum';
import { ScoringService } from '../services/scoring.service';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { IUserAnalyticsRepository } from '@/domain/analytics/repositories/user-analytics.repository.interface';
import { UserEvent } from '@/domain/analytics/entities/user-event.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { TargetResolverRegistry } from '@/application/target-resolution/target-resolution.registry';

@Injectable()
export class AnalyticsListener {
  private readonly logger = new Logger(AnalyticsListener.name);

  constructor(
    private readonly scoringService: ScoringService,
    private readonly bookRepository: IBookRepository,
    private readonly genreRepository: IGenreRepository,
    private readonly analyticsRepository: IUserAnalyticsRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly targetResolverRegistry: TargetResolverRegistry,
  ) {}

  @OnEvent('user-event.tracked')
  async handleUserEventTracked(payload: { userId: string; event: UserEvent }) {
    const { userId, event } = payload;

    if (event.bookId) {
      const book = await this.bookRepository.findById(
        BookId.create(event.bookId),
      );
      if (book && book.genres) {
        const genreIds = book.genres.map((g) =>
          typeof g === 'string' ? g : g.toString(),
        );
        await this.scoringService.calculateScore(
          userId,
          event.eventType,
          genreIds,
        );
      }
    }

    if (event.eventType === UserEventType.SEARCH && event.metadata?.keyword) {
      const metadata = event.metadata ?? {};
      const keyword = String(metadata.keyword).toLowerCase();
      const allGenres = await this.genreRepository.findAllSimple();

      const matchedGenreIds = allGenres
        .filter((genre) => {
          const name = genre.name.getValue().toLowerCase();
          return name.includes(keyword) || keyword.includes(name);
        })
        .map((genre) => genre.id.toString());

      if (matchedGenreIds.length > 0) {
        await this.scoringService.calculateScore(
          userId,
          UserEventType.SEARCH,
          matchedGenreIds,
        );
      }
    }
  }

  @OnEvent('like.toggled')
  async handleLikeToggled(payload: {
    userId: string;
    targetId: string;
    targetType: string;
    isLiked: boolean;
  }) {
    if (!payload.isLiked) return;

    const bookId = await this.resolveBookId(
      payload.targetId,
      payload.targetType,
    );
    if (bookId) {
      await this.logInternalEvent(
        payload.userId,
        UserEventType.LIKE_BOOK,
        bookId,
      );
    }
  }

  @OnEvent('comment.created')
  async handleCommentCreated(payload: {
    userId: string;
    targetId: string;
    targetType: string;
  }) {
    const bookId = await this.resolveBookId(
      payload.targetId,
      payload.targetType,
    );
    if (bookId) {
      await this.logInternalEvent(
        payload.userId,
        UserEventType.COMMENT_BOOK,
        bookId,
      );
    }
  }

  @OnEvent('post.created')
  async handlePostCreated(payload: { userId: string; bookId?: string }) {
    if (payload.bookId) {
      await this.logInternalEvent(
        payload.userId,
        UserEventType.OPEN_BOOK,
        payload.bookId,
      );
    }
  }

  private async logInternalEvent(
    userId: string,
    eventType: UserEventType,
    bookId: string,
  ) {
    const event = UserEvent.create({
      id: this.idGenerator.generate(),
      userId,
      eventType,
      bookId,
      source: 'internal',
    });

    await this.analyticsRepository.saveEvent(event);

    const book = await this.bookRepository.findById(BookId.create(bookId));
    if (book && book.genres) {
      const genreIds = book.genres.map((g) =>
        typeof g === 'string' ? g : g.toString(),
      );
      await this.scoringService.calculateScore(userId, eventType, genreIds);
    }
  }

  private async resolveBookId(
    targetId: string,
    targetType: string,
  ): Promise<string | null> {
    const resolution = await this.targetResolverRegistry.resolve(
      targetType,
      targetId,
    );
    return resolution.bookId ?? null;
  }
}
