import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slice/authSlice';
import { authApi } from '../features/auth/api/authApi';
import { postApi } from '@/src/features/posts/api/postApi';
import { booksApi } from '../features/books/api/bookApi';
import { commentApi } from '@/src/features/comments/api/commentApi';
import { chaptersApi } from '../features/chapters/api/chaptersApi';
import { bookRelationApi } from '../features/admin/api/bookRelationApi';
import { followApi } from "@/src/features/follows/api/followApi";
import { reviewApi } from '../features/reviews/api/reviewApi';
import { libraryApi } from '../features/library/api/libraryApi';
import { usersApi } from '../features/users/api/usersApi';

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
      .concat(usersApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
