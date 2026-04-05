'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    FileText, 
    Loader2, 
    Save, 
    Plus, 
    Trash2, 
    X,
    Keyboard
} from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { useModalStore } from "@/store/useModalStore";
import { 
    useCreateChapterMutation, 
    useUpdateChapterMutation,
    useLazyGetChapterByIdQuery
} from "@/features/chapters/api/chaptersApi";
import { Paragraph } from "@/features/chapters/types/chapter.interface";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ManageChapterModal() {
    const { isManageChapterOpen, closeManageChapter, manageChapterData } = useModalStore();
    const isEdit = !!manageChapterData?.chapter;
    
    const [triggerGetDetails, { isFetching: isFetchingDetails }] = useLazyGetChapterByIdQuery();
    const [createChapter, { isLoading: isCreating }] = useCreateChapterMutation();
    const [updateChapter, { isLoading: isUpdating }] = useUpdateChapterMutation();
    const isLoading = isCreating || isUpdating;

    const [title, setTitle] = useState('');
    const [paragraphs, setParagraphs] = useState<Paragraph[]>([{ id: uuidv4(), content: '' }]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadChapterDetails = async () => {
            if (isManageChapterOpen && manageChapterData?.chapter) {
                try {
                    const fullChapter = await triggerGetDetails({
                        bookSlug: manageChapterData.bookSlug,
                        chapterId: manageChapterData.chapter.id
                    }).unwrap();
                    
                    setTitle(fullChapter.title);
                    setParagraphs(fullChapter.paragraphs && fullChapter.paragraphs.length > 0 
                        ? fullChapter.paragraphs.map(p => ({ ...p })) 
                        : [{ id: uuidv4(), content: '' }]);
                } catch (error) {
                    console.error('Failed to load chapter details:', error);
                    toast.error('Không thể tải chi tiết chương');
                    closeManageChapter();
                }
            } else if (isManageChapterOpen) {
                setTitle('');
                setParagraphs([{ id: uuidv4(), content: '' }]);
            }
        };

        loadChapterDetails();
    }, [isManageChapterOpen, manageChapterData, triggerGetDetails, closeManageChapter]);

    const handleParagraphChange = (index: number, content: string) => {
        const isPaste = content.length - (paragraphs[index]?.content?.length || 0) > 10;
        
        // Smart split logic for newlines or bulk paste
        if (content.includes('\n') || (isPaste && /[.!?]\s/.test(content))) {
            const segments = content
                .split(/(?<=[.!?])\s+|\n+/)
                .map(s => s.trim())
                .filter(s => s.length > 0);

            if (segments.length > 1) {
                const newParagraphs = [...paragraphs];
                newParagraphs[index].content = segments[0];
                const newItems = segments.slice(1).map(line => ({
                    id: uuidv4(),
                    content: line
                }));
                newParagraphs.splice(index + 1, 0, ...newItems);
                setParagraphs(newParagraphs);
                return;
            }
        }

        const newParagraphs = [...paragraphs];
        newParagraphs[index].content = content;
        setParagraphs(newParagraphs);
    };

    const handleParagraphKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const cursorPosition = e.currentTarget.selectionStart;
            const content = paragraphs[index].content;
            const leftPart = content.slice(0, cursorPosition);
            const rightPart = content.slice(cursorPosition);
            
            const newParagraphs = [...paragraphs];
            newParagraphs[index].content = leftPart;
            newParagraphs.splice(index + 1, 0, { id: uuidv4(), content: rightPart });
            setParagraphs(newParagraphs);
            
            // Focus next textarea after render
            setTimeout(() => {
                const textareas = document.querySelectorAll('.chapter-paragraph-textarea');
                (textareas[index + 1] as HTMLTextAreaElement)?.focus();
            }, 0);
        } else if (e.key === 'Backspace' && paragraphs[index].content === '' && paragraphs.length > 1) {
            e.preventDefault();
            const newParagraphs = paragraphs.filter((_, i) => i !== index);
            setParagraphs(newParagraphs);
            
            setTimeout(() => {
                const textareas = document.querySelectorAll('.chapter-paragraph-textarea');
                const prevIndex = Math.max(0, index - 1);
                const el = textareas[prevIndex] as HTMLTextAreaElement;
                el.focus();
                el.setSelectionRange(el.value.length, el.value.length);
            }, 0);
        }
    };

    const addParagraph = () => {
        setParagraphs([...paragraphs, { id: uuidv4(), content: '' }]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const removeParagraph = (index: number) => {
        if (paragraphs.length === 1) return;
        setParagraphs(paragraphs.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.info('Tiêu đề chương không được để trống!');
            return;
        }

        const validParagraphs = paragraphs.filter(p => p.content.trim());
        if (validParagraphs.length === 0) {
            toast.info('Nội dung chương không được để trống!');
            return;
        }

        try {
            if (isEdit && manageChapterData?.chapter) {
                await updateChapter({
                    bookSlug: manageChapterData.bookSlug,
                    chapterId: manageChapterData.chapter.id,
                    data: {
                        title: title.trim(),
                        paragraphs: validParagraphs,
                    }
                }).unwrap();
                toast.success('Cập nhật chương thành công!');
            } else if (manageChapterData) {
                await createChapter({
                    bookSlug: manageChapterData.bookSlug,
                    data: {
                        title: title.trim(),
                        bookId: manageChapterData.bookId,
                        paragraphs: validParagraphs,
                    }
                }).unwrap();
                toast.success('Tạo chương thành công!');
            }

            manageChapterData?.onSuccess?.();
            closeManageChapter();
        } catch (error: unknown) {
            console.error('Failed to save chapter:', error);
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <Dialog open={isManageChapterOpen} onOpenChange={(open) => !open && !isLoading && closeManageChapter()}>
            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col p-0 dark:bg-gray-900 border-none shadow-2xl">
                <DialogHeader className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold dark:text-white">
                                    {isEdit ? 'Chỉnh sửa chương' : 'Thêm chương mới'}
                                </h2>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                    Quản lý nội dung chương cho sách
                                </p>
                            </div>
                        </div>
                        {isEdit && (
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                                <Keyboard className="w-3 h-3" />
                                <span>Chương #{manageChapterData?.chapter?.orderIndex}</span>
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-900/50">
                    <ScrollArea className="flex-1 px-6 py-8">
                        <div className="max-w-4xl mx-auto space-y-8">
                            {/* Title Section */}
                            <div className="space-y-3">
                                <Label htmlFor="title" className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                    Tiêu đề chương <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ví dụ: Chương 1: Sự khởi đầu..."
                                    className="h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-lg font-semibold focus:ring-blue-500 shadow-sm"
                                    required
                                    disabled={isLoading || isFetchingDetails}
                                />
                            </div>

                            {/* Paragraphs Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                        Nội dung chương ({paragraphs.length} đoạn)
                                    </Label>
                                    <div className="text-[11px] text-gray-500 font-medium italic">
                                        Mẹo: Nhấn Enter để tạo đoạn mới, Backspace để xóa đoạn trống
                                    </div>
                                </div>

                                {isFetchingDetails ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                                        <p className="text-gray-500 font-medium">Đang tải nội dung chương...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {paragraphs.map((para, index) => (
                                            <div key={para.id} className="group flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="flex-none pt-4">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 group-focus-within:bg-blue-600 group-focus-within:text-white transition-all">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                                <div className="flex-1 relative">
                                                    <Textarea
                                                        value={para.content}
                                                        onChange={(e) => handleParagraphChange(index, e.target.value)}
                                                        onKeyDown={(e) => handleParagraphKeyDown(e, index)}
                                                        placeholder={`Nhập nội dung cho đoạn ${index + 1}...`}
                                                        className="chapter-paragraph-textarea min-h-[120px] p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all text-gray-800 dark:text-gray-200 leading-relaxed"
                                                        disabled={isLoading}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeParagraph(index)}
                                                        className="absolute -right-3 top-2 p-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-red-600 hover:border-red-100 dark:hover:border-red-900/30 shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"
                                                        disabled={paragraphs.length === 1 || isLoading}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={bottomRef} className="h-4" />
                                        
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={addParagraph}
                                            className="w-full h-14 border-dashed border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-gray-500 hover:text-blue-600 font-bold transition-all gap-2"
                                            disabled={isLoading}
                                        >
                                            <Plus className="w-5 h-5" />
                                            THÊM ĐOẠN MỚI
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="px-6 py-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={closeManageChapter}
                            disabled={isLoading}
                            className="font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 h-12 px-6 transition-all"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || isFetchingDetails}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-10 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Save className="w-5 h-5 mr-2" />
                            )}
                            {isEdit ? 'LƯU THAY ĐỔI' : 'TẠO CHƯƠNG'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
