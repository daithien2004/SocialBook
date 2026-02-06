import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UIState {
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    toggleViewMode: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            viewMode: 'list', // Default to list view
            setViewMode: (mode) => set({ viewMode: mode }),
            toggleViewMode: () =>
                set((state) => ({
                    viewMode: state.viewMode === 'list' ? 'grid' : 'list',
                })),
        }),
        {
            name: 'ui-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
