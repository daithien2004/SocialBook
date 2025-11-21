// src/app/admin/books/chapters/[bookId]/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetBookByIdQuery } from '@/src/features/books/api/bookApi';
import {
    useGetAdminChaptersQuery,
    useCreateChapterMutation,
    useUpdateChapterMutation,
    useDeleteChapterMutation,
} from '@/src/features/chapters/api/chaptersApi';
import { Chapter, Paragraph } from '@/src/features/chapters/types/chapter.interface';
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function ChapterManagementPage() {
    const params = useParams();
    const bookId = params.bookId as string;

    const { data: bookData, isLoading: isLoadingBook } = useGetBookByIdQuery(bookId);
    const { data: chaptersData, isLoading: isLoadingChapters } = useGetAdminChaptersQuery({
        bookSlug: bookData?.slug || '',
    }, {
        skip: !bookData?.slug,
    });

    const [createChapter, { isLoading: isCreating }] = useCreateChapterMutation();
    const [updateChapter, { isLoading: isUpdating }] = useUpdateChapterMutation();
    const [deleteChapter] = useDeleteChapterMutation();

    const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
    const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingParagraphs, setEditingParagraphs] = useState<Paragraph[]>([]);
    const [showNewChapterForm, setShowNewChapterForm] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [newChapterParagraphs, setNewChapterParagraphs] = useState<Paragraph[]>([
        { id: uuidv4(), content: '' },
    ]);

    const book = bookData;
    const chapters = chaptersData?.chapters || [];

    // Debug logging
    console.log('📚 Chapter Management Debug:', {
        bookId,
        bookData,
        bookSlug: bookData?.slug,
        chaptersData,
        isLoadingBook,
        isLoadingChapters,
    });

    const handleToggleExpand = (chapterId: string) => {
        if (expandedChapterId === chapterId) {
            setExpandedChapterId(null);
            setEditingChapterId(null);
        } else {
            setExpandedChapterId(chapterId);
        }
    };

    const handleStartEdit = (chapter: Chapter) => {
        setEditingChapterId(chapter.id);
        setEditingTitle(chapter.title);
        setEditingParagraphs([... (chapter.paragraphs ?? [])]);
    };

    const handleCancelEdit = () => {
        setEditingChapterId(null);
        setEditingTitle('');
        setEditingParagraphs([]);
    };

    const handleSaveEdit = async (chapterId: string) => {
        if (!book?.slug) return;

        try {
            await updateChapter({
                bookSlug: book.slug,
                chapterId,
                data: {
                    title: editingTitle,
                    paragraphs: editingParagraphs.filter(p => p.content.trim()).length > 0
                        ? editingParagraphs.filter(p => p.content.trim())
                        : [{ id: uuidv4(), content: ' ' }],
                },
            }).unwrap();
            setEditingChapterId(null);
            setEditingTitle('');
            setEditingParagraphs([]);
        } catch (error) {
            console.error('Failed to update chapter:', error);
        }
    };

    const handleDeleteChapter = async (chapterId: string) => {
        if (!book?.slug) return;
        if (!confirm('Bạn có chắc muốn xóa chương này?')) return;

        try {
            await deleteChapter({ bookSlug: book.slug, chapterId }).unwrap();
            if (expandedChapterId === chapterId) {
                setExpandedChapterId(null);
            }
        } catch (error) {
            console.error('Failed to delete chapter:', error);
        }
    };

    const handleParagraphChange = (index: number, content: string, paragraphs: Paragraph[], setParagraphs: (p: Paragraph[]) => void) => {
        const newParagraphs = [...paragraphs];
        newParagraphs[index].content = content;
        setParagraphs(newParagraphs);
    };

    const handleParagraphKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>,
        index: number,
        paragraphs: Paragraph[],
        setParagraphs: (p: Paragraph[]) => void
    ) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const newParagraphs = [...paragraphs];
            newParagraphs.splice(index + 1, 0, { id: uuidv4(), content: '' });
            setParagraphs(newParagraphs);

            // Focus on new paragraph
            setTimeout(() => {
                const textareas = document.querySelectorAll('textarea');
                // We need to find the textarea that corresponds to the new paragraph
                // Since we inserted at index + 1, it should be the next one in the DOM order relative to the current one
                // However, querySelectorAll returns all textareas, so we need to be careful.
                // A safer way is to rely on the fact that the list is re-rendered.
                // Let's try to focus the one at index + 1 in the list of textareas within the container.
                // But for now, let's stick to the simple logic which usually works if the DOM order matches.
                const allTextareas = Array.from(document.querySelectorAll('textarea'));
                const currentTextarea = e.currentTarget;
                const currentIndex = allTextareas.indexOf(currentTextarea);
                if (currentIndex !== -1 && currentIndex + 1 < allTextareas.length) {
                    (allTextareas[currentIndex + 1] as HTMLTextAreaElement).focus();
                }
            }, 0);
        } else if (e.key === 'Backspace' && paragraphs[index].content === '' && paragraphs.length > 1) {
            e.preventDefault();
            const newParagraphs = paragraphs.filter((_, i) => i !== index);
            setParagraphs(newParagraphs);
            // Focus previous
            setTimeout(() => {
                const allTextareas = Array.from(document.querySelectorAll('textarea'));
                // The current one is gone, so we want the one at the previous index
                // But we need to find where the previous one *is* now.
                // Since we removed one, the "previous" one is now at `index - 1` relative to the original list.
                // But in the DOM, we just need to find the element that *was* before this one.
                // Simpler approach: focus the one at index-1 if index > 0
                if (index > 0) {
                    // We need to re-query because the DOM has changed
                    const newTextareas = document.querySelectorAll('textarea');
                    if (newTextareas[index - 1]) {
                        (newTextareas[index - 1] as HTMLTextAreaElement).focus();
                        // Optional: move cursor to end
                        const el = newTextareas[index - 1] as HTMLTextAreaElement;
                        el.setSelectionRange(el.value.length, el.value.length);
                    }
                }
            }, 0);
        }
    };

    const handleDeleteParagraph = (index: number, paragraphs: Paragraph[], setParagraphs: (p: Paragraph[]) => void) => {
        if (paragraphs.length === 1) return; // Keep at least one paragraph
        const newParagraphs = paragraphs.filter((_, i) => i !== index);
        setParagraphs(newParagraphs);
    };

    const handleCreateChapter = async () => {
        if (!book?.slug || !newChapterTitle.trim()) return;

        try {
            await createChapter({
                bookSlug: book.slug,
                data: {
                    title: newChapterTitle,
                    paragraphs: newChapterParagraphs.filter(p => p.content.trim()),
                },
            }).unwrap();
            setShowNewChapterForm(false);
            setNewChapterTitle('');
            setNewChapterParagraphs([{ id: uuidv4(), content: '' }]);
        } catch (error) {
            console.error('Failed to create chapter:', error);
        }
    };

    if (isLoadingBook || isLoadingChapters) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý chương</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Sách: <span className="font-semibold">{book?.title}</span> • {chapters.length} chương
                            </p>
                        </div>
                        <button
                            onClick={() => setShowNewChapterForm(!showNewChapterForm)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm chương mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {/* New Chapter Form */}
                    {showNewChapterForm && (
                        <div className="border-b border-gray-200 p-6 bg-blue-50">
                            <h3 className="font-semibold text-lg mb-4">Tạo chương mới</h3>
                            <input
                                type="text"
                                placeholder="Tiêu đề chương..."
                                value={newChapterTitle}
                                onChange={(e) => setNewChapterTitle(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <div className="space-y-2">
                                {newChapterParagraphs.map((para, index) => (
                                    <div key={para.id} className="flex gap-2">
                                        <textarea
                                            value={para.content}
                                            onChange={(e) => handleParagraphChange(index, e.target.value, newChapterParagraphs, setNewChapterParagraphs)}
                                            onKeyDown={(e) => handleParagraphKeyDown(e, index, newChapterParagraphs, setNewChapterParagraphs)}
                                            placeholder={`Đoạn ${index + 1} (Nhấn Enter để tạo đoạn mới)...`}
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                            rows={3}
                                        />
                                        {newChapterParagraphs.length > 1 && (
                                            <button
                                                onClick={() => handleDeleteParagraph(index, newChapterParagraphs, setNewChapterParagraphs)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={handleCreateChapter}
                                    disabled={isCreating || !newChapterTitle.trim()}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Tạo chương
                                </button>
                                <button
                                    onClick={() => {
                                        setShowNewChapterForm(false);
                                        setNewChapterTitle('');
                                        setNewChapterParagraphs([{ id: uuidv4(), content: '' }]);
                                    }}
                                    className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Chapters List */}
                    <div className="divide-y divide-gray-200">
                        {chapters.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                Chưa có chương nào. Nhấn "Thêm chương mới" để bắt đầu.
                            </div>
                        ) : (
                            chapters.map((chapter) => (
                                <div key={chapter.id} className="hover:bg-gray-50 transition-colors">
                                    {/* Chapter Header */}
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer"
                                        onClick={() => handleToggleExpand(chapter.id)}
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            {expandedChapterId === chapter.id ? (
                                                <ChevronDown className="w-5 h-5 text-gray-500" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-gray-500" />
                                            )}
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">
                                                    Chương {chapter.orderIndex}: {chapter.title}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {chapter.paragraphs?.length || 0} đoạn • {chapter.viewsCount} lượt xem
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => {
                                                    handleToggleExpand(chapter.id);
                                                    handleStartEdit(chapter);
                                                }}
                                                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 className="w-5 h-5 text-green-600" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteChapter(chapter.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-5 h-5 text-red-600" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Chapter Content (Expanded) */}
                                    {expandedChapterId === chapter.id && (
                                        <div className="px-4 pb-4 bg-gray-50">
                                            {editingChapterId === chapter.id ? (
                                                // Edit Mode
                                                <div className="space-y-4">
                                                    <input
                                                        type="text"
                                                        value={editingTitle}
                                                        onChange={(e) => setEditingTitle(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                                                    />
                                                    <div className="space-y-2">
                                                        {editingParagraphs.map((para, index) => (
                                                            <div key={para.id} className="flex gap-2">
                                                                <textarea
                                                                    value={para.content}
                                                                    onChange={(e) => handleParagraphChange(index, e.target.value, editingParagraphs, setEditingParagraphs)}
                                                                    onKeyDown={(e) => handleParagraphKeyDown(e, index, editingParagraphs, setEditingParagraphs)}
                                                                    placeholder={`Đoạn ${index + 1} (Nhấn Enter để tạo đoạn mới)...`}
                                                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                                                    rows={3}
                                                                />
                                                                {editingParagraphs.length > 1 && (
                                                                    <button
                                                                        onClick={() => handleDeleteParagraph(index, editingParagraphs, setEditingParagraphs)}
                                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                                    >
                                                                        <Trash2 className="w-5 h-5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSaveEdit(chapter.id)}
                                                            disabled={isUpdating}
                                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                                                        >
                                                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                            Lưu thay đổi
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Hủy
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // View Mode
                                                <div className="space-y-3">
                                                    {(chapter.paragraphs || []).map((para, index) => (
                                                        <div key={para.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                                            <div className="text-sm text-gray-500 mb-1">Đoạn {index + 1}</div>
                                                            <div className="text-gray-800">{para.content}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
