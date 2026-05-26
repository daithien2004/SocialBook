import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../features/auth/api/authApi';
import { postApi } from '@/features/posts/api/postApi';
import { booksApi } from '../features/books/api/bookApi';
import { commentApi } from '@/features/comments/api/commentApi';
import { chaptersApi } from '../features/chapters/api/chaptersApi';
import { bookRelationApi } from '../features/admin/api/bookRelationApi';
import { followApi } from '@/features/follows/api/followApi';
import { reviewApi } from '../features/reviews/api/reviewApi';
import { libraryApi } from '../features/library/api/libraryApi';
import { usersApi } from '../features/users/api/usersApi';
import { ttsApi } from '../features/tts/api/ttsApi';
import { authorApi } from '../features/authors/api/authorApi';
import { genreApi } from '../features/genres/api/genreApi';
import { analyticsApi } from '../features/admin/api/analyticsApi';
import { setupListeners } from '@reduxjs/toolkit/query';
import { likeApi } from '@/features/likes/api/likeApi';
import { geminiApi } from '../features/gemini/api/geminiApi';
import { recommendationsApi } from '../features/recommendations/api/recommendationsApi';
import { chatBotApi } from '../features/chatbot/api/chatBotApi';
import { moderationApi } from '../features/admin/api/moderationApi';
import { readingRoomsApi } from '../features/reading-rooms/api/readingRoomsApi';
import { roomInteractionsApi } from '../features/reading-room-interactions/api/roomInteractionsApi';



export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [postApi.reducerPath]: postApi.reducer,
    [booksApi.reducerPath]: booksApi.reducer,
    [chaptersApi.reducerPath]: chaptersApi.reducer,
    [commentApi.reducerPath]: commentApi.reducer,
    [likeApi.reducerPath]: likeApi.reducer,
    [followApi.reducerPath]: followApi.reducer,
    [bookRelationApi.reducerPath]: bookRelationApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [libraryApi.reducerPath]: libraryApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [ttsApi.reducerPath]: ttsApi.reducer,
    [authorApi.reducerPath]: authorApi.reducer,
    [genreApi.reducerPath]: genreApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [geminiApi.reducerPath]: geminiApi.reducer,
    [recommendationsApi.reducerPath]: recommendationsApi.reducer,
    [chatBotApi.reducerPath]: chatBotApi.reducer,
    [moderationApi.reducerPath]: moderationApi.reducer,
    [readingRoomsApi.reducerPath]: readingRoomsApi.reducer,
    [roomInteractionsApi.reducerPath]: roomInteractionsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(postApi.middleware)
      .concat(booksApi.middleware)
      .concat(chaptersApi.middleware)
      .concat(commentApi.middleware)
      .concat(bookRelationApi.middleware)
      .concat(reviewApi.middleware)
      .concat(libraryApi.middleware)
      .concat(followApi.middleware)
      .concat(usersApi.middleware)
      .concat(ttsApi.middleware)
      .concat(authorApi.middleware)
      .concat(genreApi.middleware)
      .concat(analyticsApi.middleware)
      .concat(likeApi.middleware)
      .concat(geminiApi.middleware)
      .concat(recommendationsApi.middleware)
      .concat(chatBotApi.middleware)
      .concat(moderationApi.middleware)
      .concat(readingRoomsApi.middleware)
      .concat(roomInteractionsApi.middleware)
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
