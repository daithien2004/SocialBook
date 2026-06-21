import { useCallback, useEffect, useState } from 'react';

export type ColorTheme = 'mono' | 'red' | 'blue';

export function useColorTheme() {
    const [colorTheme, setColorTheme] = useState<ColorTheme>('mono');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        const savedTheme = (localStorage.getItem('color-theme') as ColorTheme) || 'mono';
        if (savedTheme === 'red') {
            setColorTheme('red');
            document.documentElement.classList.add('theme-red');
            document.documentElement.classList.remove('theme-blue');
        } else if (savedTheme === 'blue') {
            setColorTheme('blue');
            document.documentElement.classList.add('theme-blue');
            document.documentElement.classList.remove('theme-red');
        } else {
            setColorTheme('mono');
            document.documentElement.classList.remove('theme-red', 'theme-blue');
        }
    }, []);

    const toggleColorTheme = useCallback(() => {
        setColorTheme((prev) => {
            let nextTheme: ColorTheme = 'mono';
            if (prev === 'mono') {
                nextTheme = 'red';
            } else if (prev === 'red') {
                nextTheme = 'blue';
            } else {
                nextTheme = 'mono';
            }

            localStorage.setItem('color-theme', nextTheme);

            if (nextTheme === 'red') {
                document.documentElement.classList.add('theme-red');
                document.documentElement.classList.remove('theme-blue');
            } else if (nextTheme === 'blue') {
                document.documentElement.classList.add('theme-blue');
                document.documentElement.classList.remove('theme-red');
            } else {
                document.documentElement.classList.remove('theme-red', 'theme-blue');
            }

            return nextTheme;
        });
    }, []);

    return { colorTheme, toggleColorTheme, mounted };
}
