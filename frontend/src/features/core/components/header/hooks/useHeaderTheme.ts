import { useCallback, useSyncExternalStore } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

interface UseHeaderThemeReturn {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    toggleTheme: () => void;
    mounted: boolean;
}

function useHydrated() {
    return useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
}

export function useHeaderTheme(): UseHeaderThemeReturn {
    const { theme, setTheme } = useNextTheme();
    const mounted = useHydrated();

    const toggleTheme = useCallback(() => {
        if (!mounted) return;
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [mounted, theme, setTheme]);

    return { theme, setTheme, toggleTheme, mounted };
}
