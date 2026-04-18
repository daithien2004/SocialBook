import { useCallback, useEffect, useState } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

interface UseHeaderThemeReturn {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    toggleTheme: () => void;
    mounted: boolean;
}

export function useHeaderTheme(): UseHeaderThemeReturn {
    const { theme, setTheme } = useNextTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = useCallback(() => {
        if (!mounted) return;
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [mounted, theme, setTheme]);

    return { theme, setTheme, toggleTheme, mounted };
}
