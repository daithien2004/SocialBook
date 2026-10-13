import { Injectable } from '@nestjs/common';
import {
  IRecommendationStrategy,
  UserProfile,
} from '@/modules/recommendations/domain/interfaces/recommendation-strategy.interface';
import { RecommendationResult } from '@/modules/recommendations/domain/interfaces/recommendation-result';
import { EnrichedRecommendation } from '@/modules/recommendations/domain/interfaces/recommendation.interface';
import { PopulatedBook } from '@/modules/recommendations/domain/interfaces/recommendation-data.repository.interface';

@Injectable()
export class FallbackRecommendationStrategy implements IRecommendationStrategy {
  generate(
    _userId: string,
    userProfile: UserProfile,
    availableBooks: PopulatedBook[],
    limit: number,
  ): Promise<RecommendationResult> {
    const favoriteGenres = new Set(userProfile.favoriteGenres);
    const matchedBooks = availableBooks
      .filter((book) =>
        book.genres?.some((genre) => favoriteGenres.has(genre.name)),
      )
      .sort(comparePopularity)
      .slice(0, limit);
    const recommendations: EnrichedRecommendation[] = matchedBooks.map(
      (book) => {
        const matchingGenre = book.genres?.find((genre) =>
          favoriteGenres.has(genre.name),
        );
        return {
          bookId: book._id,
          title: book.title,
          reason: matchingGenre
            ? `Phù hợp với sở thích: ${matchingGenre.name}`
            : 'Sách được đề xuất dựa trên hoạt động đọc của bạn',
          matchScore: 80,
          slug: book.slug,
          book,
        };
      },
    );

    if (recommendations.length < limit) {
      const selectedIds = new Set(recommendations.map(({ bookId }) => bookId));
      const remainingBooks = availableBooks
        .filter((book) => !selectedIds.has(book._id))
        .sort(comparePopularity)
        .slice(0, limit - recommendations.length);
      recommendations.push(
        ...remainingBooks.map((book) => ({
          bookId: book._id,
          title: book.title,
          reason: 'Sách được nhiều người quan tâm',
          matchScore: 50,
          slug: book.slug,
          book,
        })),
      );
    }

    return Promise.resolve({
      analysis: {
        favoriteGenres: userProfile.favoriteGenres,
        readingPace: 'medium',
        preferredLength: 'medium',
        themes: [],
      },
      recommendations,
    });
  }
}

function comparePopularity(left: PopulatedBook, right: PopulatedBook): number {
  const leftScore = left.views + left.likes * 2;
  const rightScore = right.views + right.likes * 2;
  return rightScore - leftScore || left._id.localeCompare(right._id);
}
