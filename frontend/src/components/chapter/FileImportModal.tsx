'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Upload, Check, Eye } from 'lucide-react';
import { useImportChaptersPreviewMutation } from '@/features/chapters/api/chaptersApi';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import { useModalStore } from '@/store/useModalStore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ParsedChapter {
    title: string;
    content: string;
    selected: boolean;
}

export function FileImportModal() {
    const { isFileImportOpen, closeFileImport, fileImportData } = useModalStore();
    const { bookSlug = '', currentChapterCount = 0, onImport } = fileImportData || {};

    const [file, setFile] = useState<File | null>(null);
    const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([]);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [importPreview, { isLoading: isPreviewLoading }] = useImportChaptersPreviewMutation();

    // Reset state when modal closes
    useEffect(() => {
        if (!isFileImportOpen) {
            setFile(null);
            setParsedChapters([]);
            setStep('upload');
            setSelectedChapterIndex(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [isFileImportOpen]);

    /**
     * Calculate the chapter number for display
     */
    const getChapterDisplayNumber = (index: number): number => {
        const selectedBeforeCount = parsedChapters
            .slice(0, index)
            .filter(c => c.selected)
            .length;

        return (currentChapterCount || 0) + selectedBeforeCount + 1;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handlePreview = async () => {
        if (!file || !bookSlug) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const chapters = await importPreview({ bookSlug, formData }).unwrap();
            if (!Array.isArray(chapters)) {
                throw new Error('Invalid response format from server');
            }

            setParsedChapters(
                chapters.map((chapter) => ({ ...chapter, selected: true }))
            );
            setStep('preview');
            setSelectedChapterIndex(0);
        } catch (error: any) {
            console.error('Error parsing file:', JSON.stringify(error, null, 2));
            toast.error(getErrorMessage(error));
        }
    };

    const handleToggleChapter = (index: number) => {
        setParsedChapters((prev) =>
            prev.map((chapter, i) =>
                i === index ? { ...chapter, selected: !chapter.selected } : chapter
            )
        );
    };

    const handleChapterChange = (index: number, field: 'title' | 'content', value: string) => {
        setParsedChapters((prev) =>
            prev.map((chapter, i) =>
                i === index ? { ...chapter, [field]: value } : chapter
            )
        );
    };

    const handleImportConfirm = () => {
        const selectedChapters = parsedChapters
            .filter((c) => c.selected)
            .map(({ title, content }) => ({ title, content }));

        if (selectedChapters.length === 0) {
            toast.info('Vui lòng chọn ít nhất một chương để nhập.');
            return;
        }

        if (onImport) {
            onImport(selectedChapters);
        }
        closeFileImport();
    };

    return (
        <Dialog open={isFileImportOpen} onOpenChange={closeFileImport}>
            <DialogContent className="max-w-[95vw] w-full lg:max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                {/* Header */}
                <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900">
                    <div>
                        <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Nhập chương từ tập tin
                        </DialogTitle>
                        {file && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {file.name}
                            </p>
                        )}
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#0c0c0c]">
                    {step === 'upload' ? (
                        <div className="flex items-center justify-center h-full p-6">
                            <div className="flex flex-col items-center justify-center w-full max-w-2xl h-96 border-2 border-dashed rounded-2xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors shadow-sm">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".epub,.mobi"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex flex-col items-center cursor-pointer w-full h-full justify-center"
                                >
                                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                                        {file ? file.name : 'Nhấn để tải lên EPUB hoặc MOBI'}
                                    </span>
                                    <span className="text-sm text-gray-500 mt-2">
                                        Định dạng hỗ trợ: .epub, .mobi
                                    </span>
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full">
                            {/* Left Panel - Chapter List */}
                            <div className="w-full sm:w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900/50">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                                            Danh sách chương ({parsedChapters.length})
                                        </h3>
                                        <button
                                            onClick={() =>
                                                setParsedChapters((prev) =>
                                                    prev.map((c) => ({ ...c, selected: !prev.every((x) => x.selected) }))
                                                )
                                            }
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                        >
                                            {parsedChapters.every((c) => c.selected)
                                                ? 'Bỏ chọn hết'
                                                : 'Chọn tất cả'}
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {parsedChapters.filter((c) => c.selected).length} đã chọn
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {parsedChapters.map((chapter, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedChapterIndex(index)}
                                            className={`p-4 border-b border-gray-200 dark:border-gray-800 cursor-pointer transition-all ${selectedChapterIndex === index
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 border-l-4 border-l-transparent'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${chapter.selected
                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                        }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleChapter(index);
                                                    }}
                                                >
                                                    {chapter.selected && <Check className="h-3.5 w-3.5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-medium truncate ${chapter.selected
                                                        ? 'text-gray-900 dark:text-gray-100'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                        Chương {getChapterDisplayNumber(index)}: {chapter.title || 'Không tiêu đề'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {chapter.content.length.toLocaleString()} ký tự
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Panel - Chapter Preview & Edit */}
                            <div className="hidden sm:flex flex-1 flex-col bg-white dark:bg-gray-950">
                                <div className="p-6 border-b border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                                        <Eye className="h-4 w-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Xem trước & Chỉnh sửa</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Chương {getChapterDisplayNumber(selectedChapterIndex)}
                                    </h3>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                    {parsedChapters[selectedChapterIndex] && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Tiêu đề chương
                                                </label>
                                                <input
                                                    value={parsedChapters[selectedChapterIndex].title}
                                                    onChange={(e) =>
                                                        handleChapterChange(selectedChapterIndex, 'title', e.target.value)
                                                    }
                                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white dark:bg-gray-900 text-lg font-medium shadow-sm transition-all"
                                                    placeholder="Nhập tiêu đề chương"
                                                />
                                            </div>

                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Nội dung chương
                                                    </label>
                                                    <span className="text-xs text-gray-400">
                                                        {parsedChapters[selectedChapterIndex].content.length.toLocaleString()} ký tự
                                                    </span>
                                                </div>
                                                <textarea
                                                    value={parsedChapters[selectedChapterIndex].content}
                                                    onChange={(e) =>
                                                        handleChapterChange(selectedChapterIndex, 'content', e.target.value)
                                                    }
                                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white dark:bg-gray-900 font-sans text-sm leading-relaxed min-h-[500px] resize-none shadow-sm transition-all"
                                                    placeholder="Nội dung chương..."
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 shrink-0">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {step === 'preview' && (
                            <span>
                                {parsedChapters.filter((c) => c.selected).length} / {parsedChapters.length} chương đã chọn
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {step === 'upload' ? (
                            <button
                                onClick={handlePreview}
                                disabled={!file || isPreviewLoading}
                                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-blue-500/20"
                            >
                                {isPreviewLoading && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Xem trước
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setStep('upload')}
                                    className="px-6 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold"
                                >
                                    Quay lại
                                </button>
                                <button
                                    onClick={handleImportConfirm}
                                    disabled={parsedChapters.filter((c) => c.selected).length === 0}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-blue-500/20"
                                >
                                    Nhập {parsedChapters.filter((c) => c.selected).length} Chương
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}