'use client';
// Cá nhân hóa trải nghiệm đọc
import { useEffect, useState } from 'react';
import { X, RotateCcw, Type, Palette, Layout } from 'lucide-react';
import { useReadingSettings } from '@/src/store/useReadingSettings';
import {
    useGetReadingPreferencesQuery,
    useUpdateReadingPreferencesMutation,
} from '@/src/features/users/api/usersApi';
import { useSession } from 'next-auth/react';

interface ReadingSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const FONT_FAMILIES = [
    { value: 'Georgia, serif', label: 'Serif (Georgia)', preview: 'Georgia' },
    { value: 'Arial, sans-serif', label: 'Sans-serif (Arial)', preview: 'Arial' },
    { value: '"Courier New", monospace', label: 'Monospace', preview: 'Courier New' },
    { value: '"Times New Roman", serif', label: 'Times', preview: 'Times New Roman' },
];

const THEME_PRESETS = [
    { theme: 'light', bgColor: '#ffffff', textColor: '#1a1a1a', label: 'Sáng' },
    { theme: 'dark', bgColor: '#1a1a1a', textColor: '#e5e5e5', label: 'Tối' },
    { theme: 'sepia', bgColor: '#f4ecd8', textColor: '#5c4a34', label: 'Sepia' },
];

export default function ReadingSettingsPanel({ isOpen, onClose }: ReadingSettingsPanelProps) {
    const { settings, updateSettings, resetToDefaults, loadUserPreferences } = useReadingSettings();
    const { data: session } = useSession();
    const { data: userPrefs } = useGetReadingPreferencesQuery(undefined, { skip: !session });
    const [updatePrefs] = useUpdateReadingPreferencesMutation();
    const [isInitialized, setIsInitialized] = useState(false);

    // Load user preferences từ backend khi có
    useEffect(() => {
        if (userPrefs?.data && !isInitialized) {
            loadUserPreferences(userPrefs.data);
            setIsInitialized(true);
        }
    }, [userPrefs, loadUserPreferences, isInitialized]);

    // Debounced sync to backend
    useEffect(() => {
        if (!session || !isInitialized) return;

        const timer = setTimeout(() => {
            updatePrefs(settings);
        }, 1000); // 1s debounce

        return () => clearTimeout(timer);
    }, [settings, updatePrefs, session, isInitialized]);

    const handleReset = () => {
        if (confirm('Bạn có chắc muốn đặt lại cài đặt mặc định?')) {
            resetToDefaults();
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gradient-to-br from-neutral-900 to-neutral-950 border-r border-white/10 z-[71] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-blue-400" />
                        <h2 className="font-bold text-lg text-white">Cài đặt đọc</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Settings Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Theme Selector */}
                    <Section icon={<Palette size={18} />} title="Chủ đề">
                        <div className="grid grid-cols-3 gap-2">
                            {THEME_PRESETS.map((preset) => (
                                <button
                                    key={preset.theme}
                                    onClick={() => {
                                        updateSettings({
                                            theme: preset.theme as any,
                                            backgroundColor: preset.bgColor,
                                            textColor: preset.textColor,
                                        });
                                    }}
                                    className={`relative p-3 rounded-xl border-2 transition-all ${settings.theme === preset.theme
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div
                                        className="w-full h-8 rounded-lg mb-2"
                                        style={{ backgroundColor: preset.bgColor }}
                                    />
                                    <p className="text-xs font-medium text-neutral-300">{preset.label}</p>
                                    {settings.theme === preset.theme && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </Section>

                    {/* Font Size */}
                    <Section icon={<Type size={18} />} title="Cỡ chữ">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Kích thước</span>
                                <span className="text-white font-medium">{settings.fontSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="12"
                                max="32"
                                value={settings.fontSize}
                                onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-neutral-500">
                                <span>12px</span>
                                <span>32px</span>
                            </div>
                        </div>
                    </Section>

                    {/* Font Family */}
                    <Section icon={<Type size={18} />} title="Font chữ">
                        <select
                            value={settings.fontFamily}
                            onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                            className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {FONT_FAMILIES.map((font) => (
                                <option key={font.value} value={font.value} style={{ fontFamily: font.preview }}>
                                    {font.label}
                                </option>
                            ))}
                        </select>
                    </Section>

                    {/* Line Height */}
                    <Section icon={<Layout size={18} />} title="Khoảng cách dòng">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Cao</span>
                                <span className="text-white font-medium">{settings.lineHeight.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="1.2"
                                max="2.5"
                                step="0.1"
                                value={settings.lineHeight}
                                onChange={(e) => updateSettings({ lineHeight: Number(e.target.value) })}
                                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </Section>

                    {/* Letter Spacing */}
                    <Section icon={<Type size={18} />} title="Khoảng cách chữ">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Giãn cách</span>
                                <span className="text-white font-medium">{settings.letterSpacing.toFixed(1)}px</span>
                            </div>
                            <input
                                type="range"
                                min="-2"
                                max="5"
                                step="0.5"
                                value={settings.letterSpacing}
                                onChange={(e) => updateSettings({ letterSpacing: Number(e.target.value) })}
                                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </Section>

                    {/* Text Alignment */}
                    <Section icon={<Layout size={18} />} title="Căn chỉnh văn bản">
                        <div className="flex gap-2">
                            {['left', 'center', 'justify'].map((align) => (
                                <button
                                    key={align}
                                    onClick={() => updateSettings({ textAlign: align as any })}
                                    className={`flex-1 p-2 rounded-lg border transition-all ${settings.textAlign === align
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                            : 'border-white/10 text-neutral-400 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className={`h-1 bg-current rounded ${align === 'left' ? 'w-3/4' : align === 'center' ? 'w-2/3 mx-auto' : 'w-full'}`} />
                                        <div className={`h-1 bg-current rounded ${align === 'left' ? 'w-full' : align === 'center' ? 'w-full' : 'w-full'}`} />
                                        <div className={`h-1 bg-current rounded ${align === 'left' ? 'w-2/3' : align === 'center' ? 'w-4/5 mx-auto' : 'w-full'}`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Section>

                    {/* Margin Width */}
                    <Section icon={<Layout size={18} />} title="Lề trang">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Độ rộng</span>
                                <span className="text-white font-medium">{settings.marginWidth}px</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={settings.marginWidth}
                                onChange={(e) => updateSettings({ marginWidth: Number(e.target.value) })}
                                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </Section>
                </div>

                {/* Footer - Reset Button */}
                <div className="p-5 border-t border-white/5 bg-neutral-900/50">
                    <button
                        onClick={handleReset}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors border border-white/10"
                    >
                        <RotateCcw size={16} />
                        <span className="font-medium">Đặt lại mặc định</span>
                    </button>
                </div>
            </div>
        </>
    );
}

// Helper Section Component
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <div className="text-blue-400">{icon}</div>
                <h3 className="text-sm font-semibold text-neutral-200">{title}</h3>
            </div>
            {children}
        </div>
    );
}
