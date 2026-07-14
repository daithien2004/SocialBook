import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ReadingPreferences } from '../types/reading-preferences.interface';

interface ReadingSettingsStore {
    settings: ReadingPreferences;
    setTheme: (theme: 'light' | 'dark' | 'sepia' | 'paper') => void;
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

const DARK_DEFAULTS: ReadingPreferences = {
    theme: 'dark',
    fontSize: 19,                            // 19px — dễ đọc, không quá to
    fontFamily: 'var(--font-merriweather), serif', // serif dẫn mắt tốt hơn khi đọc dài
    lineHeight: 1.7,                         // ~1.7–1.8 là sweet spot cho prose
    letterSpacing: 0.2,                      // nhẹ, tạo breathing room
    backgroundColor: '#1c1c1e',              // off-black (không pure #000) — giảm mỏi mắt
    textColor: '#d8d3c8',                    // warm off-white — ít contrast hơn #fff, dễ chịu hơn
    textAlign: 'left',                       // left tránh rivers không hyphenation
    marginWidth: 52,                         // ~65–70 ký tự/dòng — độ dài lý tưởng
    warmth: 30,                              // ấm vừa, giảm ánh sáng xanh hiển thị
    brightness: 100,
};

const LIGHT_DEFAULTS: ReadingPreferences = {
    theme: 'light',
    fontSize: 19,
    fontFamily: 'var(--font-merriweather), serif',
    lineHeight: 1.7,
    letterSpacing: 0.2,
    backgroundColor: '#f7f3ed',              // warm off-white (cream) — dịu hơn pure #fff
    textColor: '#2c2925',                    // warm dark brown — không chói như #000
    textAlign: 'left',
    marginWidth: 52,
    warmth: 5,                               // ban ngày không cần ấm
    brightness: 100,
};


function getSystemDefaults(): ReadingPreferences {
    if (typeof window === 'undefined') return DARK_DEFAULTS;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? DARK_DEFAULTS : LIGHT_DEFAULTS;
}

export const useReadingSettings = create<ReadingSettingsStore>()(
    persist(
        (set) => ({
            settings: getSystemDefaults(),

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
                    settings: getSystemDefaults(),  // re-detect lại khi reset
                }),

            loadUserPreferences: (prefs) =>
                set((state) => {
                    const hasDiff = (Object.keys(prefs) as (keyof ReadingPreferences)[]).some(
                        (key) => state.settings[key] !== prefs[key],
                    );
                    if (!hasDiff) return state;
                    return { settings: prefs };
                }),
        }),
        {
            name: 'reading-settings',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
