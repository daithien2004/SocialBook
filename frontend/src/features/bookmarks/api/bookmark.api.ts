import { apiRequest } from '@/lib/api-client';
import type {
  Bookmark,
  CreateBookmarkRequest,
} from '@/features/bookmarks/schemas/bookmark.schema';

export async function createBookmark(
  request: CreateBookmarkRequest,
): Promise<Bookmark> {
  return apiRequest<Bookmark>({
    url: '/bookmarks',
    method: 'POST',
    data: request,
  });
}

export async function deleteBookmark(paragraphId: string): Promise<void> {
  await apiRequest<void>({
    url: `/bookmarks/${paragraphId}`,
    method: 'DELETE',
  });
}

export async function getBookmarksByBook(bookId: string): Promise<Bookmark[]> {
  const response = await apiRequest<{ data: Bookmark[] }>({
    url: `/bookmarks/book/${bookId}`,
    method: 'GET',
  });
  return response.data;
}
