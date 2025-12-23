'use client';
// Cá nhân hóa trải nghiệm đọc
import { useEffect, useState } from 'react';
import { X, RotateCcw, Type, Palette, Layout, AlertTriangle } from 'lucide-react';
import { useReadingSettings } from '@/src/store/useReadingSettings';
import {
    useGetReadingPreferencesQuery,
    useUpdateReadingPreferencesMutation,
} from '@/src/features/users/api/usersApi';
import { useAppAuth } from '@/src/hooks/useAppAuth';

interface ReadingSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const FONT_FAMILIES = [
    { value: 'var(--font-merriweather), serif', label: 'Serif (Merriweather)', preview: 'var(--font-merriweather)' },
    { value: 'var(--font-inter), sans-serif', label: 'Sans-serif (Inter)', preview: 'var(--font-inter)' },
    { value: 'var(--font-notosans), sans-serif', label: 'Noto Sans', preview: 'var(--font-notosans)' },
    { value: '"Times New Roman", serif', label: 'Times', preview: 'Times New Roman' },
    { value: '"Courier New", monospace', label: 'Monospace', preview: 'Courier New' },
];

const THEME_PRESETS = [
    { theme: 'light', bgColor: '#ffffff', textColor: '#1a1a1a', label: 'Sáng' },
    { theme: 'dark', bgColor: '#1a1a1a', textColor: '#e5e5e5', label: 'Tối' },
    { theme: 'sepia', bgColor: '#f4ecd8', textColor: '#5c4a34', label: 'Sepia' },
];

export default function ReadingSettingsPanel({ isOpen, onClose }: ReadingSettingsPanelProps) {
    const { settings, updateSettings, resetToDefaults, loadUserPreferences } = useReadingSettings();
    const { isAuthenticated } = useAppAuth();
    const { data: userPrefs } = useGetReadingPreferencesQuery(undefined, { skip: !isAuthenticated });
    const [updatePrefs] = useUpdateReadingPreferencesMutation();
    const [isInitialized, setIsInitialized] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Load user preferences từ backend khi có
    useEffect(() => {
        if (userPrefs?.data && !isInitialized) {
            loadUserPreferences(userPrefs.data);
            setIsInitialized(true);
        }
    }, [userPrefs, loadUserPreferences, isInitialized]);

    // Debounced sync to backend
    useEffect(() => {
        if (!isAuthenticated || !isInitialized) return;

        const timer = setTimeout(() => {
            updatePrefs(settings);
        }, 1000); // 1s debounce

        return () => clearTimeout(timer);
    }, [settings, updatePrefs, isAuthenticated, isInitialized]);

    const handleReset = async () => {
        setIsResetting(true);
        try {
            resetToDefaults();
            // Thêm delay nhỏ để có thể thấy loading state
            await new Promise(resolve => setTimeout(resolve, 300));
            setShowResetDialog(false);
        } catch (error) {
            console.error('Reset failed:', error);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-[#09090b] border-r border-gray-200 dark:border-white/10 z-[71] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col font-sans ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#09090b]">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                            <Palette size={18} className="text-gray-900 dark:text-white" />
                        </div>
                        <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Cài đặt đọc</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Settings Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-gray-50/50 dark:bg-[#0c0c0c]">
                    {/* Theme Selector */}
                    <Section icon={<Palette size={18} />} title="Chủ đề">
                        <div className="grid grid-cols-3 gap-3">
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
                                    className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${settings.theme === preset.theme
                                        ? 'border-black dark:border-white shadow-md bg-white dark:bg-white/5'
                                        : 'border-transparent bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                                        }`}
                                >
                                    <div
                                        className="w-full h-10 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm"
                                        style={{ backgroundColor: preset.bgColor }}
                                    />
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{preset.label}</p>
                                    {settings.theme === preset.theme && (
                                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-lg">
                                            <div className="w-2 h-2 rounded-full bg-current" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </Section>

                    {/* Font Size */}
                    <Section icon={<Type size={18} />} title="Cỡ chữ">
                        <div className="space-y-3 bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Kích thước</span>
                                <span className="text-gray-900 dark:text-white font-medium">{settings.fontSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="12"
                                max="32"
                                value={settings.fontSize}
                                onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                                className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                            />
                            <div className="flex justify-between text-xs text-gray-400">
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
                            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/20 transition-all font-medium text-sm"
                        >
                            {FONT_FAMILIES.map((font) => (
                                <option
                                    key={font.value}
                                    value={font.value}
                                    style={{ fontFamily: font.preview }}
                                    className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                                >
                                    {font.label}
                                </option>
                            ))}
                        </select>
                    </Section>

                    {/* Line Height */}
                    <Section icon={<Layout size={18} />} title="Khoảng cách dòng">
                        <div className="space-y-3 bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Độ cao</span>
                                <span className="text-gray-900 dark:text-white font-medium">{settings.lineHeight.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="1.2"
                                max="2.5"
                                step="0.1"
                                value={settings.lineHeight}
                                onChange={(e) => updateSettings({ lineHeight: Number(e.target.value) })}
                                className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                            />
                        </div>
                    </Section>

                    {/* Letter Spacing */}
                    <Section icon={<Type size={18} />} title="Khoảng cách chữ">
                        <div className="space-y-3 bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Giãn cách</span>
                                <span className="text-gray-900 dark:text-white font-medium">{settings.letterSpacing.toFixed(1)}px</span>
                            </div>
                            <input
                                type="range"
                                min="-2"
                                max="5"
                                step="0.5"
                                value={settings.letterSpacing}
                                onChange={(e) => updateSettings({ letterSpacing: Number(e.target.value) })}
                                className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                            />
                        </div>
                    </Section>

                    {/* Text Alignment */}
                    <Section icon={<Layout size={18} />} title="Căn chỉnh văn bản">
                        <div className="flex gap-2 bg-white dark:bg-white/5 p-1 rounded-xl border border-gray-100 dark:border-white/5">
                            {['left', 'center', 'justify'].map((align) => (
                                <button
                                    key={align}
                                    onClick={() => updateSettings({ textAlign: align as any })}
                                    className={`flex-1 p-2 rounded-lg transition-all ${settings.textAlign === align
                                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                                        : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <div className="flex flex-col gap-1 items-center justify-center py-1">
                                        <div className={`h-0.5 bg-current rounded ${align === 'left' ? 'w-3/4' : align === 'center' ? 'w-2/3' : 'w-full'}`} />
                                        <div className={`h-0.5 bg-current rounded w-full`} />
                                        <div className={`h-0.5 bg-current rounded ${align === 'left' ? 'w-2/3' : align === 'center' ? 'w-4/5' : 'w-full'}`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Section>

                    {/* Margin Width */}
                    <Section icon={<Layout size={18} />} title="Lề trang">
                        <div className="space-y-3 bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Độ rộng</span>
                                <span className="text-gray-900 dark:text-white font-medium">{settings.marginWidth}px</span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="100"
                                value={settings.marginWidth}
                                onChange={(e) => updateSettings({ marginWidth: Number(e.target.value) })}
                                className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                            />
                        </div>
                    </Section>
                </div>

                {/* Footer - Reset Button */}
                <div className="p-5 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#09090b]">
                    <button
                        onClick={() => setShowResetDialog(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-xl transition-colors font-medium text-sm"
                    >
                        <RotateCcw size={16} />
                        <span className="font-medium">Đặt lại mặc định</span>
                    </button>
                </div>
            </div>

            {/* Reset Dialog Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] transition-opacity duration-300 ${showResetDialog ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                onClick={() => !isResetting && setShowResetDialog(false)}
            />

            {/* Reset Confirmation Dialog */}
            <div
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] w-full max-w-sm transition-all duration-300 ${showResetDialog ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
                    }`}
            >
                <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#09090b]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Đặt lại cài đặt?</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Thao tác này không thể hoàn tác</p>
                            </div>
                        </div>
                        <button
                            onClick={() => !isResetting && setShowResetDialog(false)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                            disabled={isResetting}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 bg-gray-50/50 dark:bg-[#0c0c0c]">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            Tất cả các cài đặt đọc của bạn sẽ được khôi phục về giá trị mặc định. Font chữ, cỡ chữ, chủ đề và các tùy chọn khác sẽ bị đặt lại.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-gray-100 dark:border-white/5 flex gap-3 bg-white dark:bg-[#09090b]">
                        <button
                            onClick={() => setShowResetDialog(false)}
                            disabled={isResetting}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={isResetting}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
                        >
                            {isResetting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Đang xử lý...</span>
                                </>
                            ) : (
                                <>
                                    <RotateCcw size={16} />
                                    <span>Xác nhận</span>
                                </>
                            )}
                        </button>
                    </div>
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
                <div className="text-gray-400 dark:text-gray-500">{icon}</div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
            </div>
            {children}
        </div>
    );
}