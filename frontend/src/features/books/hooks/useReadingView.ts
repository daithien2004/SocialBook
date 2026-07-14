import { useEffect, useRef } from 'react';

export type ViewMode = 'read' | 'listen';

export interface UseReadingViewResult {
    viewMode: ViewMode;
    isControlsVisible: boolean;
    showTOC: boolean;
    showSettings: boolean;
    setViewMode: (mode: ViewMode) => void;
    setShowTOC: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
}

import { create } from 'zustand';

interface ReadingViewState extends UseReadingViewResult {
    setIsControlsVisible: (visible: boolean) => void;
}

const useReadingViewStore = create<ReadingViewState>((set) => ({
    viewMode: 'read',
    isControlsVisible: true,
    showTOC: false,
    showSettings: false,
    setViewMode: (mode) => set({ viewMode: mode }),
    setShowTOC: (show) => set({ showTOC: show }),
    setShowSettings: (show) => set({ showSettings: show }),
    setIsControlsVisible: (visible) => set({ isControlsVisible: visible }),
}));

export function useReadingView(): UseReadingViewResult {
    const store = useReadingViewStore();
    const setIsControlsVisible = useReadingViewStore((state) => state.setIsControlsVisible);
    
    const lastScrollYRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (rafRef.current !== null) return;

            rafRef.current = requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                const isScrollingDown = currentScrollY > lastScrollYRef.current;
                lastScrollYRef.current = currentScrollY;

                if (isScrollingDown && currentScrollY > 100) {
                    setIsControlsVisible(false);
                } else {
                    setIsControlsVisible(true);
                }

                rafRef.current = null;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [setIsControlsVisible]);

    return {
        viewMode: store.viewMode,
        isControlsVisible: store.isControlsVisible,
        showTOC: store.showTOC,
        showSettings: store.showSettings,
        setViewMode: store.setViewMode,
        setShowTOC: store.setShowTOC,
        setShowSettings: store.setShowSettings,
    };
}
