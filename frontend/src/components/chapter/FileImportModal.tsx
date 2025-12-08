import React, { useState, useRef } from 'react';
import { Loader2, Upload, Check, X, Eye } from 'lucide-react';
import { useImportChaptersPreviewMutation } from '@/src/features/chapters/api/chaptersApi';

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
    const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
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
            const chapters = await importPreview({ bookSlug, formData }).unwrap();
            console.log('FileImportModal response:', chapters);

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
            const errorMessage = error?.data?.message || error?.message || 'Failed to parse file. Please try again.';
            alert(errorMessage);
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
            alert('Please select at least one chapter to import.');
            return;
        }

        onImport(selectedChapters);
    };

    const resetState = () => {
        setFile(null);
        setParsedChapters([]);
        setStep('upload');
        setSelectedChapterIndex(0);
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
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-[95vw] max-w-[1800px] h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Import Chapters from File
                        </h2>
                        {file && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {file.name}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {step === 'upload' ? (
                        <div className="flex items-center justify-center h-full p-6">
                            <div className="flex flex-col items-center justify-center w-full max-w-2xl h-96 border-2 border-dashed rounded-lg border-gray-300 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
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
                                    <Upload className="h-16 w-16 text-gray-400 mb-4" />
                                    <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                                        {file ? file.name : 'Click to upload EPUB or PDF'}
                                    </span>
                                    <span className="text-sm text-gray-500 mt-2">
                                        Supported formats: .epub, .pdf
                                    </span>
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full">
                            {/* Left Panel - Chapter List */}
                            <div className="w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900/50">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            Chapters ({parsedChapters.length})
                                        </h3>
                                        <button
                                            onClick={() =>
                                                setParsedChapters((prev) =>
                                                    prev.map((c) => ({ ...c, selected: !prev.every((x) => x.selected) }))
                                                )
                                            }
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            {parsedChapters.every((c) => c.selected)
                                                ? 'Deselect All'
                                                : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {parsedChapters.filter((c) => c.selected).length} selected
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {parsedChapters.map((chapter, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedChapterIndex(index)}
                                            className={`p-4 border-b border-gray-200 dark:border-gray-800 cursor-pointer transition-colors ${
                                                selectedChapterIndex === index
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 border-l-4 border-l-transparent'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                        chapter.selected
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleChapter(index);
                                                    }}
                                                >
                                                    {chapter.selected && <Check className="h-3.5 w-3.5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-medium truncate ${
                                                        chapter.selected
                                                            ? 'text-gray-900 dark:text-gray-100'
                                                            : 'text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                        {chapter.title || `Chapter ${index + 1}`}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {chapter.content.length.toLocaleString()} characters
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Panel - Chapter Preview & Edit */}
                            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                                        <Eye className="h-4 w-4" />
                                        <span className="text-xs font-medium uppercase tracking-wide">Preview & Edit</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Chapter {selectedChapterIndex + 1}
                                    </h3>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {parsedChapters[selectedChapterIndex] && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Chapter Title
                                                </label>
                                                <input
                                                    value={parsedChapters[selectedChapterIndex].title}
                                                    onChange={(e) =>
                                                        handleChapterChange(selectedChapterIndex, 'title', e.target.value)
                                                    }
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 dark:border-gray-700 text-lg font-medium"
                                                    placeholder="Enter chapter title"
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Chapter Content
                                                    </label>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {parsedChapters[selectedChapterIndex].content.length.toLocaleString()} characters
                                                    </span>
                                                </div>
                                                <textarea
                                                    value={parsedChapters[selectedChapterIndex].content}
                                                    onChange={(e) =>
                                                        handleChapterChange(selectedChapterIndex, 'content', e.target.value)
                                                    }
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 dark:border-gray-700 font-mono text-sm resize-none"
                                                    style={{ minHeight: '500px' }}
                                                    placeholder="Chapter content will appear here..."
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
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {step === 'preview' && (
                            <span>
                                {parsedChapters.filter((c) => c.selected).length} of {parsedChapters.length} chapters selected
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {step === 'upload' ? (
                            <button
                                onClick={handlePreview}
                                disabled={!file || isPreviewLoading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
                                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors font-medium"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleImportConfirm}
                                    disabled={isImporting || parsedChapters.filter((c) => c.selected).length === 0}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
        </div>
    );
}