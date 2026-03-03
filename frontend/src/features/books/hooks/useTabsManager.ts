// features/books/hooks/useTabsManager.ts
import { useState, useCallback } from "react";
import { TabType } from "../books.constants";
import { createInitialTabStates, deduplicateBooks } from "../books.utils";
import { PaginatedData, Book, TabStates, TabState } from "../types/book.interface";

interface UseTabsManagerProps {
    activeTab: TabType;
}

interface UseTabsManagerReturn {
    tabStates: TabStates;
    currentState: TabState;
    loadMoreBooks: () => void;
    setFetchedData: (data: PaginatedData<Book>) => void;
}

export function useTabsManager({
    activeTab,
}: UseTabsManagerProps): UseTabsManagerReturn {
    const [tabStates, setTabStates] = useState<TabStates>(
        createInitialTabStates()
    );

    const currentState = tabStates[activeTab];

    const setFetchedData = useCallback((data: PaginatedData<Book>) => {
        if (!data?.data || !data?.meta) return;

        const newBooks = data.data;
        const metaData = data.meta;

        setTabStates((prev) => {
            const current = prev[activeTab];

            if (current.page === 1) {
                return {
                    ...prev,
                    [activeTab]: {
                        ...current,
                        books: newBooks,
                        hasMore: metaData.current < metaData.totalPages,
                        isInitialized: true,
                    },
                };
            }


            const uniqueBooks = deduplicateBooks(current.books, newBooks);

            return {
                ...prev,
                [activeTab]: {
                    ...current,
                    books: [...current.books, ...uniqueBooks],
                    hasMore: metaData.current< metaData.totalPages,
                    isInitialized: true,
                },
            };
        });
    }, [activeTab]);

    const loadMoreBooks = useCallback(() => {
        setTabStates((prev) => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                page: prev[activeTab].page + 1,
            },
        }));
    }, [activeTab]);

    return {
        tabStates,
        currentState,
        loadMoreBooks,
        setFetchedData,
    };
}