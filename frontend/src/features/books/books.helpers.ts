import { BookTagType, BOOK_TAGS } from "./api/bookApi";
import { BookForAdmin, LikeResult } from "./types/book.interface";


export function buildListTags<T extends Record<string, any>>(
    items: T[] | undefined,
    tagType: BookTagType,
    idField: keyof T = 'slug' as keyof T
) {
    if (!items) {
        return [{ type: tagType, id: 'LIST' }] as const;
    }

    return [
        ...items.map((item) => ({
            type: tagType,
            id: item[idField] as string,
        })),
        { type: tagType, id: 'LIST' },
    ];
}

export function buildUpdateBookInvalidationTags(
    result: BookForAdmin | undefined,
    bookId: string
) {
    const tags: Array<{ type: BookTagType; id: string }> = [
        { type: BOOK_TAGS.ADMIN_BOOKS, id: bookId },
        { type: BOOK_TAGS.ADMIN_BOOKS, id: 'LIST' },
        { type: BOOK_TAGS.BOOKS, id: 'LIST' },
    ];

    if (result?.slug) {
        tags.push({
            type: BOOK_TAGS.BOOK_DETAIL,
            id: result.slug,
        });
    }

    return tags;
}

export function buildLikeBookInvalidationTags(
    result: LikeResult | undefined,
    bookId: string
) {
    const tags: Array<{ type: BookTagType; id: string }> = [
        { type: BOOK_TAGS.BOOK_STATS, id: bookId },
    ];

    if (result?.slug) {
        tags.push({
            type: BOOK_TAGS.BOOK_DETAIL,
            id: result.slug,
        });
    }

    return tags;
}