'use client';

import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { useSummarizeChapterMutation } from '@/features/gemini/api/geminiApi';
import { toast } from 'sonner';
import { useModalStore } from '@/store/useModalStore';
import { useAppAuth } from '@/features/auth/hooks';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function ChapterSummaryModal() {
    const { isChapterSummaryOpen, closeChapterSummary, chapterSummaryData } = useModalStore();
    const { user } = useAppAuth();
    const [summarize, { isLoading, error, data: summary }] = useSummarizeChapterMutation();
    const [hasFetched, setHasFetched] = useState(false);
    const [wasOpen, setWasOpen] = useState(isChapterSummaryOpen);

    const chapterId = chapterSummaryData?.chapterId;
    const chapterTitle = chapterSummaryData?.chapterTitle;

    if (isChapterSummaryOpen !== wasOpen) {
        setWasOpen(isChapterSummaryOpen);
        if (!isChapterSummaryOpen) {
            setHasFetched(false);
        }
    }

    const handleSummarize = async () => {
        if (!chapterId) return;
        try {
            await summarize({ chapterId, userId: user?.id }).unwrap();
            setHasFetched(true);
        } catch {
            toast.error('Không thể tạo tóm tắt. Vui lòng thử lại.');
        }
    };

    return (
        <Dialog open={isChapterSummaryOpen} onOpenChange={closeChapterSummary}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-5 border-b border-border bg-background shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
                            <Sparkles size={16} className="text-background" />
                        </div>
                        <DialogTitle className="font-semibold text-lg text-foreground">
                            Tóm tắt AI
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="p-6 overflow-y-auto custom-scrollbar bg-muted flex-1">
                    <h4 className="text-muted-foreground font-medium mb-6 text-sm flex items-center gap-2">
                        Đang tóm tắt: <span className="text-foreground font-semibold">{chapterTitle}</span>
                    </h4>

                    {/* Initial State */}
                    {!summary && !isLoading && !hasFetched && (
                        <div className="text-center py-12 space-y-6">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles size={32} className="text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-foreground font-medium">Bắt đầu tóm tắt</p>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                                    Sử dụng trí tuệ nhân tạo để phân tích và tóm tắt nội dung chính của chương này trong vài giây.
                                </p>
                            </div>
                            <button
                                onClick={handleSummarize}
                                className="px-8 py-3 bg-foreground text-background rounded-xl font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto shadow-lg"
                            >
                                <Sparkles size={18} />
                                Tạo tóm tắt
                            </button>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-center py-16 space-y-4">
                            <Loader2 size={32} className="animate-spin text-foreground mx-auto" />
                            <p className="text-muted-foreground text-sm animate-pulse font-medium">
                                Đang xử lý nội dung...
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-destructive text-xl font-bold">X</span>
                            </div>
                            <p className="text-muted-foreground text-sm">
                                Đã có lỗi xảy ra.
                            </p>
                            <button
                                onClick={handleSummarize}
                                className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto text-muted-foreground"
                            >
                                <RefreshCw size={14} />
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Success State (Summary) */}
                    {summary && !isLoading && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-card border border-border rounded-2xl p-6 text-foreground leading-7 text-[15px] shadow-sm whitespace-pre-line">
                                {summary?.summary}
                            </div>
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={handleSummarize}
                                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors rounded-lg hover:bg-accent"
                                    title="Tạo lại tóm tắt mới"
                                >
                                    <RefreshCw size={14} />
                                    Tạo lại
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
