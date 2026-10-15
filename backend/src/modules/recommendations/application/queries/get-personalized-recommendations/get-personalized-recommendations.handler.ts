import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetPersonalizedRecommendationsQuery } from './get-personalized-recommendations.query';
import { Logger } from '@nestjs/common';
import { IRecommendationFactory } from '@/modules/recommendations/domain/interfaces/recommendation-factory.interface';
import { IRecommendationDataRepository } from '@/modules/recommendations/domain/interfaces/recommendation-data.repository.interface';
import { RecommendationResult } from '@/modules/recommendations/domain/interfaces/recommendation-result';
import { buildPaginationMeta } from '@/shared/domain/pagination.types';
import type { RecommendationsReadModel } from '../../read-models/recommendations.read-model';

@QueryHandler(GetPersonalizedRecommendationsQuery)
export class GetPersonalizedRecommendationsHandler implements IQueryHandler<GetPersonalizedRecommendationsQuery> {
  private readonly logger = new Logger(
    GetPersonalizedRecommendationsHandler.name,
  );

  constructor(
    private readonly recommendationFactory: IRecommendationFactory,
    private readonly dataRepository: IRecommendationDataRepository,
  ) {}

  async execute(
    query: GetPersonalizedRecommendationsQuery,
  ): Promise<RecommendationsReadModel> {
    const { page, limit } = query;
    const userId = query.actor.userId;
    this.logger.log(
      `Getting recommendations for user ${userId} (page ${page}, limit ${limit})`,
    );

    const userProfile = await this.dataRepository.buildUserProfile(userId);
    const availableBooks = await this.dataRepository.getAvailableBooks(userId);

    const strategy = await this.recommendationFactory.getStrategy(userId);
    const recommendationsResponse: RecommendationResult =
      await strategy.generate(userId, userProfile, availableBooks, 100);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecommendations =
      recommendationsResponse.recommendations.slice(startIndex, endIndex);

    return {
      analysis: recommendationsResponse.analysis,
      recommendations: paginatedRecommendations.map((item) => ({
        bookId: item.bookId,
        title: item.title,
        reason: item.reason,
        matchScore: item.matchScore,
        slug: item.slug,
        book: {
          id: item.book.id,
          title: item.book.title,
          slug: item.book.slug,
          description: item.book.description,
          coverUrl: item.book.coverUrl,
          views: item.book.views,
          likes: item.book.likes,
          status: item.book.status,
          isDeleted: item.book.isDeleted,
          genres: (item.book.genres ?? []).map((genre) => ({
            id: genre.id,
            name: genre.name,
            slug: genre.slug,
          })),
          author: item.book.authorId
            ? {
                id: item.book.authorId.id,
                name: item.book.authorId.name,
                avatar: item.book.authorId.avatar,
              }
            : undefined,
        },
      })),
      meta: buildPaginationMeta(
        page,
        limit,
        recommendationsResponse.recommendations.length,
      ),
    };
  }
}
