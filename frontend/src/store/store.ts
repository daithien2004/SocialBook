import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slice/authSlice';
import { authApi } from '../features/auth/api/authApi';
import { postApi } from "@/src/features/posts/api/postApi";
import { booksApi } from '../features/books/api/bookApi';

export const store = configureStore({
  reducer: {
    auth: authReducer, // State: state.auth
    [authApi.reducerPath]: authApi.reducer, // State: state.authApi
    [postApi.reducerPath]: postApi.reducer,
    [booksApi.reducerPath]: booksApi.reducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware)
      .concat(postApi.middleware)
      .concat(booksApi.middleware), // Thêm middleware của RTK Query

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
