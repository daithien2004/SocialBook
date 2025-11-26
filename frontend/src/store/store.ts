import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slice/authSlice';
import { authApi } from '../features/auth/api/authApi';
import { postApi } from '@/src/features/posts/api/postApi';
import { booksApi } from '../features/books/api/bookApi';
import { commentApi } from '@/src/features/comments/api/commentApi';
import { chaptersApi } from '../features/chapters/api/chaptersApi';
import { bookRelationApi } from '../features/admin/api/bookRelationApi';
import { followApi } from '@/src/features/follows/api/followApi';
import { reviewApi } from '../features/reviews/api/reviewApi';
import { libraryApi } from '../features/library/api/libraryApi';
import { usersApi } from '../features/users/api/usersApi';
import { ttsApi } from '../features/tts/api/ttsApi';
import { authorApi } from '../features/authors/api/authorApi';
import { genreApi } from '../features/genres/api/genreApi';
import { analyticsApi } from '../features/admin/api/analyticsApi';
import { setupListeners } from '@reduxjs/toolkit/query';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [postApi.reducerPath]: postApi.reducer,
    [booksApi.reducerPath]: booksApi.reducer,
    [chaptersApi.reducerPath]: chaptersApi.reducer,
    [commentApi.reducerPath]: commentApi.reducer,
    [followApi.reducerPath]: followApi.reducer,
    [bookRelationApi.reducerPath]: bookRelationApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [libraryApi.reducerPath]: libraryApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [ttsApi.reducerPath]: ttsApi.reducer,
    [authorApi.reducerPath]: authorApi.reducer,
    [genreApi.reducerPath]: genreApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
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
      .concat(analyticsApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
