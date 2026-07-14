'use client';

import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, BookOpen } from 'lucide-react';
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
            <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden border-border bg-card shadow-2xl rounded-2xl">
                <DialogHeader className="p-5 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Sparkles size={16} className="text-muted-foreground" />
                        </div>
                        <div>
                            <DialogTitle className="font-semibold text-lg text-foreground">
                                Tóm tắt chương
                            </DialogTitle>
                            {chapterTitle && (
                                <p className="text-[13px] text-muted-foreground mt-0.5">
                                    <BookOpen className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                                    {chapterTitle}
                                </p>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* Initial State */}
                    {!summary && !isLoading && !hasFetched && !error && (
                        <div className="text-center py-12 space-y-6">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
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
                        <div className="py-8 space-y-5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                    <Sparkles size={16} className="text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Đang tóm tắt nội dung...</p>
                                    <p className="text-[13px] text-muted-foreground">Xử lý toàn bộ chương để lấy ý chính</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 bg-muted rounded-full w-full" />
                                <div className="h-4 bg-muted rounded-full w-3/4" />
                                <div className="h-4 bg-muted rounded-full w-5/6" />
                                <div className="h-4 bg-muted rounded-full w-2/3" />
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-2">
                                <Loader2 size={14} className="animate-spin text-muted-foreground" />
                                <span className="text-[13px] text-muted-foreground">Đang xử lý...</span>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-destructive text-xl font-bold">!</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-foreground font-medium">Không thể tạo tóm tắt</p>
                                <p className="text-muted-foreground text-sm">Có lỗi xảy ra. Vui lòng thử lại sau.</p>
                            </div>
                            <button
                                onClick={handleSummarize}
                                className="px-5 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto shadow-lg"
                            >
                                <RefreshCw size={16} />
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Success State (Summary) */}
                    {summary && !isLoading && (
                        <div className="space-y-5">
                            <div className="bg-card border border-border rounded-2xl p-5">
                                <p className="text-[15px] text-foreground leading-7 whitespace-pre-line">
                                    {summary?.summary}
                                </p>
                            </div>

                            <div className="flex justify-center pt-1">
                                <button
                                    onClick={handleSummarize}
                                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors rounded-lg hover:bg-accent"
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
