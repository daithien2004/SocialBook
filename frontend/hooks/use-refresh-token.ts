'use client';

import { useQuery } from '@tanstack/react-query';
import { refreshToken } from '@/lib/api';
import { useAppDispatch } from '@/hooks/use-app-dispatch';
import { setAccessToken } from '@/lib/auth-slice';

export const useRefreshToken = () => {
  const dispatch = useAppDispatch();

  useQuery({
    queryKey: ['refreshToken'],
    queryFn: async () => {
      const data = await refreshToken();
      dispatch(setAccessToken(data.accessToken));
      return data;
    },
    retry: false,
    refetchInterval: 15 * 60 * 1000, // Làm mới mỗi 15 phút
  });
};
