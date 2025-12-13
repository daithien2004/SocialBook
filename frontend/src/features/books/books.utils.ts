import { TAB_CONFIG } from "./books.constants";
import { Book, TabState, TabStates } from "./types/book.interface";

export function deduplicateBooks(
    existingBooks: Book[],
    newBooks: Book[]
): Book[] {
    const existingIds = new Set(existingBooks.map((b) => b.id));
    return newBooks.filter((book) => !existingIds.has(book.id));
}

export function createInitialTabStates(): TabStates {
    const initialState: TabState = {
        books: [],
        page: 1,
        hasMore: true,
        isInitialized: false,
    };

    return Object.keys(TAB_CONFIG).reduce((acc, key) => {
        const tabId = TAB_CONFIG[key as keyof typeof TAB_CONFIG].id;
        return { ...acc, [tabId]: { ...initialState } };
    }, {} as TabStates);
}

export function shouldLoadMore(
    isFetching: boolean,
    hasMore: boolean
): boolean {
    return !isFetching && hasMore;
}