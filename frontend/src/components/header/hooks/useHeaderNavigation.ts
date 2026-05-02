import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface UseHeaderNavigationReturn {
    navigateToHome: () => void;
    navigateToBooks: () => void;
    navigateToPosts: () => void;
    navigateToLibrary: () => void;
    navigateToReadingRooms: () => void;
    navigateToProfile: (userId: string) => void;
    navigateToFollowing: (userId: string) => void;
    navigateToSettings: () => void;
    navigateToLogin: () => void;
}

export function useHeaderNavigation(): UseHeaderNavigationReturn {
    const router = useRouter();

    const navigateToHome = useCallback(() => router.push('/'), [router]);
    const navigateToBooks = useCallback(() => router.push('/books'), [router]);
    const navigateToPosts = useCallback(() => router.push('/posts'), [router]);
    const navigateToLibrary = useCallback(() => router.push('/library'), [router]);
    const navigateToReadingRooms = useCallback(() => router.push('/reading-rooms'), [router]);
    const navigateToSettings = useCallback(() => router.push('/settings'), [router]);
    const navigateToLogin = useCallback(() => router.push('/login'), [router]);
    const navigateToProfile = useCallback((userId: string) => router.push(`/users/${userId}`), [router]);
    const navigateToFollowing = useCallback((userId: string) => router.push(`/users/${userId}/following`), [router]);

    return {
        navigateToHome,
        navigateToBooks,
        navigateToPosts,
        navigateToLibrary,
        navigateToReadingRooms,
        navigateToProfile,
        navigateToFollowing,
        navigateToSettings,
        navigateToLogin,
    };
}
