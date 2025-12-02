import React, { useState, useRef } from 'react';
import { useImportChaptersPreviewMutation } from '@/src/features/chapters/api/chaptersApi';
import { Loader2, Upload, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface FileImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (chapters: { title: string; content: string }[]) => void;
    isLoading?: boolean;
    bookSlug: string;
}

interface ParsedChapter {
    title: string;
    content: string;
    selected: boolean;
}

export function FileImportModal({
    isOpen,
    onClose,
    onImport,
    isLoading: isImporting,
    bookSlug,
}: FileImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([]);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [importPreview, { isLoading: isPreviewLoading }] = useImportChaptersPreviewMutation();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handlePreview = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await importPreview({ bookSlug, formData }).unwrap();
            setParsedChapters(
                response.data.map((chapter) => ({ ...chapter, selected: true }))
            );
            setStep('preview');
        } catch (error: any) {
            console.error('Error parsing file:', JSON.stringify(error, null, 2));
            const errorMessage = error?.data?.message || error?.message || 'Failed to parse file. Please try again.';
            toast.error(errorMessage);
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
            toast.warning('Please select at least one chapter to import.');
            return;
        }

        onImport(selectedChapters);
    };

    const resetState = () => {
        setFile(null);
        setParsedChapters([]);
        setStep('upload');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Import Chapters from File
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-6">
                    {step === 'upload' ? (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg border-gray-300 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".epub,.pdf"
                                className="hidden"
                                onChange={handleFileChange}
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center cursor-pointer w-full h-full justify-center"
                            >
                                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    {file ? file.name : 'Click to upload EPUB or PDF'}
                                </span>
                                <span className="text-sm text-gray-500 mt-2">
                                    Supported formats: .epub, .pdf
                                </span>
                            </label>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Found {parsedChapters.length} chapters
                                </h3>
                                <button
                                    onClick={() =>
                                        setParsedChapters((prev) =>
                                            prev.map((c) => ({ ...c, selected: !prev.every((x) => x.selected) }))
                                        )
                                    }
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    {parsedChapters.every((c) => c.selected)
                                        ? 'Deselect All'
                                        : 'Select All'}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                {parsedChapters.map((chapter, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 border rounded-lg transition-colors ${chapter.selected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-800 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`mt-1 h-5 w-5 rounded border flex items-center justify-center cursor-pointer flex-shrink-0 ${chapter.selected
                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                    : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                onClick={() => handleToggleChapter(index)}
                                            >
                                                {chapter.selected && <Check className="h-3.5 w-3.5" />}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <input
                                                    value={chapter.title}
                                                    onChange={(e) =>
                                                        handleChapterChange(index, 'title', e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 dark:border-gray-700"
                                                    placeholder="Chapter Title"
                                                />
                                                <textarea
                                                    value={chapter.content}
                                                    onChange={(e) =>
                                                        handleChapterChange(index, 'content', e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 dark:border-gray-700 font-mono text-sm min-h-[120px]"
                                                    placeholder="Chapter Content"
                                                />
                                                <div className="text-xs text-gray-500 text-right">
                                                    {chapter.content.length} characters
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                    {step === 'upload' ? (
                        <button
                            onClick={handlePreview}
                            disabled={!file || isPreviewLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isPreviewLoading && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Preview Chapters
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep('upload')}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleImportConfirm}
                                disabled={isImporting}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isImporting && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Import {parsedChapters.filter((c) => c.selected).length} Chapters
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
