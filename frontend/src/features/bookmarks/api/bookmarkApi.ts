export { useCreateBookmark, useDeleteBookmark } from '@/features/bookmarks/api/bookmark.mutations';
export {
  createBookmark,
  deleteBookmark,
  getBookmarksByBook,
} from '@/features/bookmarks/api/bookmark.api';
export type {
  Bookmark,
  CreateBookmarkRequest,
} from '@/features/bookmarks/schemas/bookmark.schema';