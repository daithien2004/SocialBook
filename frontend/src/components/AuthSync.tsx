'use client';

import { useEffect } from 'react';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useDispatch } from 'react-redux';
import { logout, setCredentials } from '../features/auth/slice/authSlice';

export default function AuthSync() {
  const { user, accessToken, isAuthenticated } = useAppAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(
        setCredentials({
          user: {
            id: user.id || '',
            email: user.email || '',
            username: user.username || '',
            image: user.image || undefined,
          },
          accessToken: accessToken || '',
        })
      );
    } else if (!isAuthenticated) {
      // status === 'unauthenticated'
      dispatch(logout());
    }
  }, [isAuthenticated, user, accessToken, dispatch]);

  return null; // Component này không render ra UI
}
