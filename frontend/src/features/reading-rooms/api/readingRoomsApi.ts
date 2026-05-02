import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';

export interface RoomResponse {
  roomId: string;
  bookId: string;
  hostId: string;
  mode: 'sync' | 'free' | 'discussion';
  currentChapterSlug: string;
  highlights?: Array<{
    id: string;
    userId: string;
    chapterSlug: string;
    paragraphId: string;
    content: string;
    aiInsight?: string;
    createdAt: string;
  }>;
  chatMessages?: Array<{
    userId: string;
    role: 'user' | 'ai';
    content: string;
    createdAt: string;
  }>;
}



export const readingRoomsApi = createApi({
  reducerPath: 'readingRoomsApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    createRoom: builder.mutation<RoomResponse, { bookId: string; currentChapterSlug: string; mode: string; maxMembers?: number }>({
      query: (body) => ({
        url: '/reading-rooms',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MyRooms'],
    }),
    getRoom: builder.query<RoomResponse, string>({
      query: (code) => ({
        url: `/reading-rooms/${code}`,
        method: 'GET',
      }),
    }),
    getMyActiveRooms: builder.query<RoomResponse[], void>({
      query: () => ({
        url: '/reading-rooms/my-active',
        method: 'GET',
      }),
      providesTags: ['MyRooms'],
    }),
  }),
  tagTypes: ['MyRooms'],
});

export const { useCreateRoomMutation, useGetRoomQuery, useGetMyActiveRoomsQuery } = readingRoomsApi;
