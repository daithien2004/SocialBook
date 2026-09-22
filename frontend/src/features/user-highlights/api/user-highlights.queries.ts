import { userHighlightKeys } from '@/lib/query-keys';
import {
  getHighlightsByBook,
  getHighlightsByChapter,
} from './user-highlights.api';
import type { UserHighlight } from '../types/user-highlight.interface';

export const userHighlightQueries = {
  byBook: (bookId: string) => ({
    queryKey: userHighlightKeys.byBook(bookId),
    queryFn: (): Promise<UserHighlight[]> => getHighlightsByBook(bookId),
  }),
  byChapter: (chapterId: string) => ({
    queryKey: userHighlightKeys.byChapter(chapterId),
    queryFn: (): Promise<UserHighlight[]> => getHighlightsByChapter(chapterId),
  }),
};