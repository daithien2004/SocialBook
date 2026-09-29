import { useEffect, useRef } from 'react';

export type ViewMode = 'read' | 'listen';

export interface UseReadingViewResult {
    isControlsVisible: boolean;
}

import { create } from 'zustand';

interface ReadingViewState extends UseReadingViewResult {
    setIsControlsVisible: (visible: boolean) => void;
}

const useReadingViewStore = create<ReadingViewState>((set) => ({
    isControlsVisible: true,
    setIsControlsVisible: (visible) => set({ isControlsVisible: visible }),
}));

export function useReadingView(): UseReadingViewResult {
    const isControlsVisible = useReadingViewStore((state) => state.isControlsVisible);
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
        isControlsVisible,
    };
}
