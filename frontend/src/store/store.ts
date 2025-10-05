import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slice/authSlice';
import { authApi } from '../features/auth/api/authApi';

export const store = configureStore({
  reducer: {
    auth: authReducer, // State: state.auth
    [authApi.reducerPath]: authApi.reducer, // State: state.authApi
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware), // Thêm middleware của RTK Query
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
