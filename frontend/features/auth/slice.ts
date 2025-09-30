import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    logout(state) {
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
