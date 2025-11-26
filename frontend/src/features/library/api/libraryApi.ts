// src/features/library/api/libraryApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { BFF_LIBRARY_ENDPOINTS } from '@/src/constants/client-endpoints';
import {
  LibraryItem,
  Collection,
  CollectionDetailResponse,
  LibraryStatus,
  UpdateProgressRequest,
  UpdateStatusRequest,
  AddToCollectionsRequest,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from '../types/library.interface';

export const libraryApi = createApi({
  reducerPath: 'libraryApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Library', 'Collection'], // Định nghĩa Tags
  endpoints: (builder) => ({
    // --- LIBRARY ENDPOINTS ---

    // 1. Lấy danh sách sách theo trạng thái (3 Tabs)
    getLibraryBooks: builder.query<LibraryItem[], { status: LibraryStatus }>({
      query: ({ status }) => ({
        url: BFF_LIBRARY_ENDPOINTS.getLibrary,
        method: 'GET',
        params: { status },
      }),
      // Gắn tag 'Library' với id là status (READING, ARCHIVED...)
      providesTags: (result, error, { status }) => [
        { type: 'Library', id: `LIST_${status}` },
        { type: 'Library', id: 'LIST_ALL' },
      ],
    }),

    // 2. Cập nhật trạng thái (Bookmark / Archive)
    updateLibraryStatus: builder.mutation<LibraryItem, UpdateStatusRequest>({
      query: (data) => ({
        url: BFF_LIBRARY_ENDPOINTS.updateStatus,
        method: 'POST',
        body: data,
      }),
      // Khi đổi trạng thái, sách sẽ bay từ Tab này sang Tab kia -> Reload tất cả
      invalidatesTags: ['Library'],
    }),

    getChapterProgress: builder.query<
      { progress: number },
      { bookId: string; chapterId: string }
    >({
      query: ({ bookId, chapterId }) => ({
        url: BFF_LIBRARY_ENDPOINTS.updateProgress,
        method: 'GET',
        params: { bookId, chapterId },
      }),
      // Chỉ cần fetch 1 lần khi mount, không cần cache lâu
      keepUnusedDataFor: 0,
    }),

    // 3. Update tiến độ đọc (Scroll / Next Chapter)
    updateReadingProgress: builder.mutation<LibraryItem, UpdateProgressRequest>(
      {
        query: (data) => ({
          url: BFF_LIBRARY_ENDPOINTS.updateProgress,
          method: 'PATCH',
          body: data,
        }),
        // Update xong thì reload list READING để nút "Đọc tiếp" cập nhật chương mới nhất
        invalidatesTags: [
          { type: 'Library', id: `LIST_${LibraryStatus.READING}` },
        ],
      }
    ),

    // 4. Gán sách vào Folder
    addBookToCollections: builder.mutation<
      LibraryItem,
      AddToCollectionsRequest
    >({
      query: (data) => ({
        url: BFF_LIBRARY_ENDPOINTS.updateBookCollections,
        method: 'PATCH',
        body: data,
      }),
      // Cập nhật xong thì reload lại chi tiết các Collection liên quan
      invalidatesTags: ['Collection'],
    }),

    // 5. Xóa sách
    removeBookFromLibrary: builder.mutation<null, string>({
      query: (bookId) => ({
        url: BFF_LIBRARY_ENDPOINTS.removeBook(bookId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Library', 'Collection'],
    }),

    // 6. Lấy thông tin thư viện của 1 sách (Status + Collections)
    getBookLibraryInfo: builder.query<
      { status: LibraryStatus | null; collections: Collection[] },
      string
    >({
      query: (bookId) => ({
        url: BFF_LIBRARY_ENDPOINTS.getBookLibraryInfo(bookId),
        method: 'GET',
      }),
      providesTags: (result, error, bookId) => [
        { type: 'Library', id: `BOOK_${bookId}` },
      ],
    }),

    // --- COLLECTIONS ENDPOINTS (FOLDER) ---

    // 6. Lấy danh sách Folder
    getCollections: builder.query<Collection[], string | void>({
      query: (userId) => ({
        url: userId
            ? `${BFF_LIBRARY_ENDPOINTS.collections}?userId=${userId}`
            : BFF_LIBRARY_ENDPOINTS.collections,
        method: 'GET',
      }),
      providesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    // 7. Lấy chi tiết 1 Folder + Sách bên trong
    getCollectionDetail: builder.query<CollectionDetailResponse, string>({
      query: (id) => ({
        url: BFF_LIBRARY_ENDPOINTS.collectionDetail(id),
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Collection', id }],
    }),

    // 8. Tạo Folder mới
    createCollection: builder.mutation<Collection, CreateCollectionRequest>({
      query: (data) => ({
        url: BFF_LIBRARY_ENDPOINTS.collections,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    // 9. Đổi tên Folder
    updateCollection: builder.mutation<
      Collection,
      { id: string; data: UpdateCollectionRequest }
    >({
      query: ({ id, data }) => ({
        url: BFF_LIBRARY_ENDPOINTS.collectionDetail(id),
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Collection', id },
        { type: 'Collection', id: 'LIST' },
      ],
    }),

    // 10. Xóa Folder
    deleteCollection: builder.mutation<null, string>({
      query: (id) => ({
        url: BFF_LIBRARY_ENDPOINTS.collectionDetail(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['Collection'],
    }),
  }),
});

export const {
  // Library Hooks
  useGetLibraryBooksQuery,
  useUpdateLibraryStatusMutation,
  useGetChapterProgressQuery,
  useUpdateReadingProgressMutation,
  useAddBookToCollectionsMutation,
  useRemoveBookFromLibraryMutation,
  useGetBookLibraryInfoQuery,

  // Collection Hooks
  useGetCollectionsQuery,
  useGetCollectionDetailQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
} = libraryApi;
