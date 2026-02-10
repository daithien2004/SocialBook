import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { NESTJS_LIBRARY_ENDPOINTS } from '@/constants/server-endpoints';
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
import { recommendationsApi } from '../../recommendations/api/recommendationsApi';

export const libraryApi = createApi({
  reducerPath: 'libraryApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Library', 'Collection'],
  endpoints: (builder) => ({
    getLibraryBooks: builder.query<LibraryItem[], { status: LibraryStatus }>({
      query: ({ status }) => ({
        url: NESTJS_LIBRARY_ENDPOINTS.getLibrary,
        method: 'GET',
        params: { status },
      }),
      providesTags: (result, error, { status }) => [
        { type: 'Library', id: `LIST_${status}` },
        { type: 'Library', id: 'LIST_ALL' },
      ],
    }),

    updateLibraryStatus: builder.mutation<LibraryItem, UpdateStatusRequest>({
      query: (data) => ({
        url: NESTJS_LIBRARY_ENDPOINTS.updateStatus,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Library'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(recommendationsApi.util.resetApiState());
      },
    }),

    getChapterProgress: builder.query<
      { progress: number },
      { bookId: string; chapterId: string }
    >({
      query: ({ bookId, chapterId }) => ({
        url: NESTJS_LIBRARY_ENDPOINTS.updateProgress,
        method: 'GET',
        params: { bookId, chapterId },
      }),
      keepUnusedDataFor: 0,
    }),

    updateReadingProgress: builder.mutation<LibraryItem, UpdateProgressRequest>(
      {
        query: (data) => ({
          url: NESTJS_LIBRARY_ENDPOINTS.updateProgress,
          method: 'PATCH',
          body: data,
        }),
        invalidatesTags: [
          { type: 'Library', id: `LIST_${LibraryStatus.READING}` },
          { type: 'Library', id: 'LIST_ALL' },
        ],
      }
    ),

    addBookToCollections: builder.mutation<
      LibraryItem,
      AddToCollectionsRequest
    >({
      query: (data) => ({
        url: NESTJS_LIBRARY_ENDPOINTS.updateBookCollections,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Collection'],
    }),

    removeBookFromLibrary: builder.mutation<null, string>({
      query: (bookId) => ({
        url: NESTJS_LIBRARY_ENDPOINTS.removeBook(bookId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Library', 'Collection'],
    }),

    getBookLibraryInfo: builder.query<
      { status: LibraryStatus | null; collections: Collection[] },
      string
    >({
      query: (bookId) => ({
        url: NESTJS_LIBRARY_ENDPOINTS.getBookLibraryInfo(bookId),
        method: 'GET',
      }),
      providesTags: (result, error, bookId) => [
        { type: 'Library', id: `BOOK_${bookId}` },
      ],
    }),

    getCollections: builder.query<Collection[], string | void>({
      query: (userId) => ({
        url: `${NESTJS_LIBRARY_ENDPOINTS.collections}?userId=${userId}`,
        method: 'GET',
      }),
      providesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    getCollectionDetail: builder.query<CollectionDetailResponse, string>({
      query: (id) => ({
        url: NESTJS_LIBRARY_ENDPOINTS.collectionDetail(id),
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Collection', id }],
    }),

    getCollectionDetailNoAuth: builder.query<
      CollectionDetailResponse,
      { id: string; userId: string }
    >({
      query: ({ id, userId }) => ({
        url: NESTJS_LIBRARY_ENDPOINTS.collectionDetailUser(userId, id),
        method: 'GET',
      }),
      providesTags: (result, error, { id }) => [
        { type: 'Collection' as const, id },
      ],
    }),

    createCollection: builder.mutation<Collection, CreateCollectionRequest>({
      query: (data) => ({
        url: NESTJS_LIBRARY_ENDPOINTS.collections,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    updateCollection: builder.mutation<
      Collection,
      { id: string; data: UpdateCollectionRequest }
    >({
      query: ({ id, data }) => ({
        url: NESTJS_LIBRARY_ENDPOINTS.collectionDetail(id),
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Collection', id },
        { type: 'Collection', id: 'LIST' },
      ],
    }),

    deleteCollection: builder.mutation<null, string>({
      query: (id) => ({
        url: NESTJS_LIBRARY_ENDPOINTS.collectionDetail(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['Collection'],
    }),

    recordReadingTime: builder.mutation<any, { bookId: string; chapterId: string; durationInSeconds: number }>({
      query: (body) => ({
        url: NESTJS_LIBRARY_ENDPOINTS.readingTime,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { bookId }) => [
        { type: 'Library', id: 'LIST_ALL' }
      ]
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
  useGetCollectionDetailNoAuthQuery,
  useGetBookLibraryInfoQuery,

  // Collection Hooks
  useGetCollectionsQuery,
  useGetCollectionDetailQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useRecordReadingTimeMutation,
} = libraryApi;
