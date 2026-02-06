'use client';
// Cá nhân hóa trải nghiệm đọc
import { cn } from '@/lib/utils';
import { Button } from '@/src/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/src/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/src/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/src/components/ui/sheet';
import { Slider } from '@/src/components/ui/slider';
import {
    useGetReadingPreferencesQuery,
    useUpdateReadingPreferencesMutation,
} from '@/src/features/users/api/usersApi';
import { useAppAuth } from '@/src/hooks/useAppAuth';
import { useReadingSettings } from '@/src/store/useReadingSettings';
import { AlertTriangle, Layout, Palette, RotateCcw, Type } from 'lucide-react';
import { useEffect, useState } from 'react';

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
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent side="left" className="w-80 p-0 flex flex-col gap-0 border-r border-border bg-background">
                    <SheetHeader className="p-5 border-b border-border bg-background flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-muted rounded-lg">
                                <Palette size={18} className="text-foreground" />
                            </div>
                            <SheetTitle className="text-lg font-semibold">Cài đặt đọc</SheetTitle>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-muted/20">
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
                                        className={cn(
                                            "relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                            settings.theme === preset.theme
                                                ? "border-primary shadow-md bg-card"
                                                : "border-transparent bg-card hover:bg-accent"
                                        )}
                                    >
                                        <div
                                            className="w-full h-10 rounded-lg border border-border shadow-sm"
                                            style={{ backgroundColor: preset.bgColor }}
                                        />
                                        <p className="text-xs font-medium text-muted-foreground">{preset.label}</p>
                                        {settings.theme === preset.theme && (
                                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
                                                <div className="w-2 h-2 rounded-full bg-current" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </Section>

                        {/* Font Size */}
                        <Section icon={<Type size={18} />} title="Cỡ chữ">
                            <div className="space-y-4 bg-card p-4 rounded-xl border border-border">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Kích thước</span>
                                    <span className="font-medium">{settings.fontSize}px</span>
                                </div>
                                <Slider
                                    min={12}
                                    max={32}
                                    step={1}
                                    value={[settings.fontSize]}
                                    onValueChange={(vals) => updateSettings({ fontSize: vals[0] })}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>12px</span>
                                    <span>32px</span>
                                </div>
                            </div>
                        </Section>

                        {/* Font Family */}
                        <Section icon={<Type size={18} />} title="Font chữ">
                            <Select
                                value={settings.fontFamily}
                                onValueChange={(val) => updateSettings({ fontFamily: val })}
                            >
                                <SelectTrigger className="w-full bg-card h-12">
                                    <SelectValue placeholder="Chọn font chữ" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_FAMILIES.map((font) => (
                                        <SelectItem
                                            key={font.value}
                                            value={font.value}
                                            style={{ fontFamily: font.preview }}
                                        >
                                            {font.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Section>

                        {/* Line Height */}
                        <Section icon={<Layout size={18} />} title="Khoảng cách dòng">
                            <div className="space-y-4 bg-card p-4 rounded-xl border border-border">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Độ cao</span>
                                    <span className="font-medium">{settings.lineHeight.toFixed(1)}</span>
                                </div>
                                <Slider
                                    min={1.2}
                                    max={2.5}
                                    step={0.1}
                                    value={[settings.lineHeight]}
                                    onValueChange={(vals) => updateSettings({ lineHeight: vals[0] })}
                                />
                            </div>
                        </Section>

                        {/* Letter Spacing */}
                        <Section icon={<Type size={18} />} title="Khoảng cách chữ">
                            <div className="space-y-4 bg-card p-4 rounded-xl border border-border">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Giãn cách</span>
                                    <span className="font-medium">{settings.letterSpacing.toFixed(1)}px</span>
                                </div>
                                <Slider
                                    min={-2}
                                    max={5}
                                    step={0.5}
                                    value={[settings.letterSpacing]}
                                    onValueChange={(vals) => updateSettings({ letterSpacing: vals[0] })}
                                />
                            </div>
                        </Section>

                        {/* Text Alignment */}
                        <Section icon={<Layout size={18} />} title="Căn chỉnh văn bản">
                            <div className="flex gap-2 bg-card p-1 rounded-xl border border-border">
                                {['left', 'center', 'justify'].map((align) => (
                                    <Button
                                        key={align}
                                        variant={settings.textAlign === align ? 'default' : 'ghost'}
                                        onClick={() => updateSettings({ textAlign: align as any })}
                                        className="flex-1 px-0 h-9"
                                    >
                                        <div className="flex flex-col gap-1 items-center justify-center py-1 w-full scale-75">
                                            <div className={cn("h-0.5 bg-current rounded", align === 'left' ? 'w-3/4 mr-auto' : align === 'center' ? 'w-2/3' : 'w-full')} />
                                            <div className="h-0.5 bg-current rounded w-full" />
                                            <div className={cn("h-0.5 bg-current rounded", align === 'left' ? 'w-2/3 mr-auto' : align === 'center' ? 'w-4/5' : 'w-full')} />
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </Section>

                        {/* Margin Width */}
                        <Section icon={<Layout size={18} />} title="Lề trang">
                            <div className="space-y-4 bg-card p-4 rounded-xl border border-border">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Độ rộng</span>
                                    <span className="font-medium">{settings.marginWidth}px</span>
                                </div>
                                <Slider
                                    min={20}
                                    max={100}
                                    step={1}
                                    value={[settings.marginWidth]}
                                    onValueChange={(vals) => updateSettings({ marginWidth: vals[0] })}
                                />
                            </div>
                        </Section>
                    </div>

                    <div className="p-5 border-t border-border bg-background">
                        <Button
                            variant="secondary"
                            onClick={() => setShowResetDialog(true)}
                            className="w-full gap-2"
                        >
                            <RotateCcw size={16} />
                            <span className="font-medium">Đặt lại mặc định</span>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Đặt lại cài đặt?
                        </DialogTitle>
                        <DialogDescription>
                            Tất cả các cài đặt đọc của bạn sẽ được khôi phục về giá trị mặc định. Font chữ, cỡ chữ, chủ đề và các tùy chọn khác sẽ bị đặt lại. Thao tác này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowResetDialog(false)}
                            disabled={isResetting}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReset}
                            disabled={isResetting}
                        >
                            {isResetting ? 'Đang xử lý...' : 'Xác nhận'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Helper Section Component
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
                {icon}
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            </div>
            {children}
        </div>
    );
}