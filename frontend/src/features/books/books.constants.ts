import { Flame, Sparkles, BookPlus, Star } from 'lucide-react';

export const PAGINATION = {
    BOOKS_PER_PAGE: 20,
    FEATURED_BOOKS_COUNT: 5,
    SCROLL_THRESHOLD: '200px',
} as const;

export const GRID_COLUMNS = {
    MOBILE: 2,
    SM: 3,
    MD: 4,
    LG: 5,
    XL: 6,
} as const;

export const TAB_CONFIG = {
    TRENDING: {
        id: 'trending',
        label: 'Hot nhất',
        icon: Flame,
        sortBy: 'views',
    },
    NEW: {
        id: 'new',
        label: 'Mới nhất',
        icon: BookPlus,
        sortBy: 'createdAt',
    },
    TOP_RATED: {
        id: 'topRated',
        label: 'Đánh giá cao',
        icon: Star,
        sortBy: 'likes',
    },
    UPDATED: {
        id: 'updated',
        label: 'Mới cập nhật',
        icon: Sparkles,
        sortBy: 'updatedAt',
    },
} as const;

export const TABS = Object.values(TAB_CONFIG);

export type TabType = typeof TAB_CONFIG[keyof typeof TAB_CONFIG]['id'];

export const SORT_OPTIONS = [
    { value: 'score', order: 'desc', label: 'Phù hợp nhất' },
    { value: 'createdAt', order: 'desc', label: 'Mới nhất' },
    { value: 'updatedAt', order: 'desc', label: 'Mới cập nhật' },
    { value: 'createdAt', order: 'asc', label: 'Cũ nhất' },
    { value: 'views', order: 'desc', label: 'Đọc nhiều nhất' },
    { value: 'rating', order: 'desc', label: 'Đánh giá cao' },
    { value: 'likes', order: 'desc', label: 'Yêu thích nhất' },
] as const;

export type SortOptionValue = typeof SORT_OPTIONS[number];

export const DEFAULT_SORT: SortOptionValue = { value: 'createdAt', order: 'desc', label: 'Mới nhất' };