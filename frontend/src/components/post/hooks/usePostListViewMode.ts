'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';

export function usePostListViewMode() {
    const { viewMode, setViewMode } = useUIStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return {
        viewMode,
        setViewMode,
        mounted,
    };
}
