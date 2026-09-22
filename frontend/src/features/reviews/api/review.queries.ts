import { reviewKeys } from '@/lib/query-keys';
import { getReviewsByBook } from './review.api';
import type { Review } from '../types/review.interface';

export const reviewQueries = {
  byBook: (bookId: string) => ({
    queryKey: reviewKeys.byBook(bookId),
    queryFn: (): Promise<Review[]> => getReviewsByBook(bookId),
  }),
};