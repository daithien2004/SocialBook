'use client';

import { useSyncExternalStore } from 'react';
import { useUIStore } from '@/store/useUIStore';

function useHydrated() {
    return useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
}

export function usePostListViewMode() {
    const { viewMode, setViewMode } = useUIStore();
    const mounted = useHydrated();

    return {
        viewMode,
        setViewMode,
        mounted,
    };
}
