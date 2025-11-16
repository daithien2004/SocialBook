import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slice/authSlice';
import { authApi } from '../features/auth/api/authApi';
import { postApi } from '@/src/features/posts/api/postApi';
import { booksApi } from '../features/books/api/bookApi';
import { commentApi } from '@/src/features/comments/api/commentApi';
import { chaptersApi } from '../features/chapters/api/chaptersApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [postApi.reducerPath]: postApi.reducer,
    [booksApi.reducerPath]: booksApi.reducer,
    [chaptersApi.reducerPath]: chaptersApi.reducer,
    [commentApi.reducerPath]: commentApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(postApi.middleware)
      .concat(booksApi.middleware)
      .concat(chaptersApi.middleware)
      .concat(commentApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
