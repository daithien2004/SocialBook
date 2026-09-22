import { Inter, Merriweather, Noto_Sans } from 'next/font/google';

export const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });

export const merriweather = Merriweather({
    weight: ['300', '400', '700', '900'],
    subsets: ['latin', 'vietnamese'],
    variable: '--font-merriweather',
});

export const notoSans = Noto_Sans({
    subsets: ['latin', 'vietnamese'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-notosans',
});
