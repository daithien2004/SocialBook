import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ReadingPreferences } from '../types/reading-preferences.interface';

interface ReadingSettingsStore {
    settings: ReadingPreferences;
    setTheme: (theme: 'light' | 'dark' | 'sepia') => void;
    setFontSize: (size: number) => void;
    setFontFamily: (family: string) => void;
    setLineHeight: (height: number) => void;
    setLetterSpacing: (spacing: number) => void;
    setBackgroundColor: (color: string) => void;
    setTextColor: (color: string) => void;
    setTextAlign: (align: 'left' | 'center' | 'justify') => void;
    setMarginWidth: (width: number) => void;
    updateSettings: (partial: Partial<ReadingPreferences>) => void;
    resetToDefaults: () => void;
    loadUserPreferences: (prefs: ReadingPreferences) => void;
}

const defaultSettings: ReadingPreferences = {
    theme: 'dark',
    fontSize: 18,
    fontFamily: 'Georgia, serif',
    lineHeight: 1.8,
    letterSpacing: 0.5,
    backgroundColor: '#1a1a1a',
    textColor: '#e5e5e5',
    textAlign: 'justify',
    marginWidth: 40,
};

export const useReadingSettings = create<ReadingSettingsStore>()(
    persist(
        (set) => ({
            settings: defaultSettings,

            setTheme: (theme) =>
                set((state) => ({
                    settings: { ...state.settings, theme },
                })),

            setFontSize: (fontSize) =>
                set((state) => ({
                    settings: { ...state.settings, fontSize },
                })),

            setFontFamily: (fontFamily) =>
                set((state) => ({
                    settings: { ...state.settings, fontFamily },
                })),

            setLineHeight: (lineHeight) =>
                set((state) => ({
                    settings: { ...state.settings, lineHeight },
                })),

            setLetterSpacing: (letterSpacing) =>
                set((state) => ({
                    settings: { ...state.settings, letterSpacing },
                })),

            setBackgroundColor: (backgroundColor) =>
                set((state) => ({
                    settings: { ...state.settings, backgroundColor },
                })),

            setTextColor: (textColor) =>
                set((state) => ({
                    settings: { ...state.settings, textColor },
                })),

            setTextAlign: (textAlign) =>
                set((state) => ({
                    settings: { ...state.settings, textAlign },
                })),

            setMarginWidth: (marginWidth) =>
                set((state) => ({
                    settings: { ...state.settings, marginWidth },
                })),

            updateSettings: (partial) =>
                set((state) => ({
                    settings: { ...state.settings, ...partial },
                })),

            resetToDefaults: () =>
                set({
                    settings: defaultSettings,
                }),

            loadUserPreferences: (prefs) =>
                set({
                    settings: prefs,
                }),
        }),
        {
            name: 'reading-settings',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
