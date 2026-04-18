import { useState, useEffect } from 'react';

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

export function useReadingView(): UseReadingViewResult {
    const [viewMode, setViewMode] = useState<ViewMode>('read');
    const [showTOC, setShowTOC] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsControlsVisible(false);
            } else {
                setIsControlsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return {
        viewMode,
        isControlsVisible,
        showTOC,
        showSettings,
        setViewMode,
        setShowTOC,
        setShowSettings,
    };
}
