import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useDispatch } from 'react-redux';
import { logout } from '@/features/auth/slice/authSlice';
import { recommendationsApi } from '@/features/recommendations/api/recommendationsApi';

export interface UseLogoutResult {
    handleLogout: () => Promise<void>;
}

export function useLogout(): UseLogoutResult {
    const router = useRouter();
    const dispatch = useDispatch();

    const handleLogout = useCallback(async () => {
        dispatch(recommendationsApi.util.resetApiState());
        dispatch(logout());
        await signOut({ redirect: false });
        router.push('/login');
    }, [dispatch, router]);

    return { handleLogout };
}
