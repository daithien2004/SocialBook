'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDispatch } from 'react-redux';
import { logout, setCredentials } from '../features/auth/slice/authSlice';

export default function AuthSync() {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();

  useEffect(() => {
    if (status === 'authenticated') {
      dispatch(
        setCredentials({
          user: {
            id: session.user.id || '',
            email: session.user.email || '',
            username: session.user.username || '',
            image: session.user.image || undefined,
          },
          accessToken: session.accessToken || '',
        })
      );
    } else {
      // status === 'unauthenticated'
      dispatch(logout());
    }
  }, [status, session, dispatch]);

  return null; // Component này không render ra UI
}
