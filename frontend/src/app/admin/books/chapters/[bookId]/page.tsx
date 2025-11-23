'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetBookByIdQuery } from '@/src/features/books/api/bookApi';
import {
  useGetAdminChaptersQuery,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useGetChapterByIdQuery,
  useLazyGetChapterByIdQuery,
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

  const [triggerGetChapter, { isFetching: isFetchingDetails }] = useLazyGetChapterByIdQuery();
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

  const handleStartEdit = async (chapter: Chapter) => {
    if (!book?.slug) return;

    setEditingChapterId(chapter.id);
    setEditingTitle(chapter.title);
    setEditingParagraphs([]); // Clear while loading

    try {
      const fullChapter = await triggerGetChapter({
        bookSlug: book.slug,
        chapterId: chapter.id
      }).unwrap();

      setEditingTitle(fullChapter.title);
      const paras = fullChapter.paragraphs && fullChapter.paragraphs.length > 0
        ? fullChapter.paragraphs
        : [{ id: uuidv4(), content: '' }];
      setEditingParagraphs(paras);
    } catch (error) {
      console.error('Failed to fetch chapter details for editing:', error);
      setEditingChapterId(null);
    }
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

  const handleParagraphChange = (
    index: number,
    content: string,
    paragraphs: Paragraph[],
    setParagraphs: (p: Paragraph[]) => void
  ) => {
    if (content.includes('\n')) {
      const lines = content.split('\n');
      const newParagraphs = paragraphs.map(p => ({ ...p }));

      // First line goes to current paragraph
      newParagraphs[index].content = lines[0];

      // Subsequent lines become new paragraphs
      const newItems = lines.slice(1).map(line => ({
        id: uuidv4(),
        content: line
      }));

      newParagraphs.splice(index + 1, 0, ...newItems);
      setParagraphs(newParagraphs);
    } else {
      const newParagraphs = paragraphs.map(p => ({ ...p }));
      newParagraphs[index].content = content;
      setParagraphs(newParagraphs);
    }
  };

  const handleParagraphKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
    paragraphs: Paragraph[],
    setParagraphs: (p: Paragraph[]) => void
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      const cursorPosition = e.currentTarget.selectionStart;
      const content = paragraphs[index].content;

      const leftPart = content.slice(0, cursorPosition);
      const rightPart = content.slice(cursorPosition);

      const newParagraphs = paragraphs.map(p => ({ ...p }));

      // Update current
      newParagraphs[index].content = leftPart;

      // Create new with right part
      newParagraphs.splice(index + 1, 0, { id: uuidv4(), content: rightPart });

      setParagraphs(newParagraphs);

      setTimeout(() => {
        const allTextareas = Array.from(document.querySelectorAll('textarea'));
        const currentIdx = allTextareas.indexOf(e.currentTarget);
        if (currentIdx !== -1 && currentIdx + 1 < allTextareas.length) {
          const nextTextarea = allTextareas[currentIdx + 1] as HTMLTextAreaElement;
          nextTextarea.focus();
          nextTextarea.setSelectionRange(0, 0);
        }
      }, 0);
    } else if (e.key === 'Backspace' && paragraphs[index].content === '' && paragraphs.length > 1) {
      e.preventDefault();

      const newParagraphs = paragraphs
        .map(p => ({ ...p }))
        .filter((_, i) => i !== index);

      setParagraphs(newParagraphs);

      setTimeout(() => {
        const allTextareas = Array.from(document.querySelectorAll('textarea'));
        const newTextareas = document.querySelectorAll('textarea');
        if (index > 0 && newTextareas[index - 1]) {
          const el = newTextareas[index - 1] as HTMLTextAreaElement;
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
      }, 0);
    }
  };


  const handleDeleteParagraph = (
    index: number,
    paragraphs: Paragraph[],
    setParagraphs: (p: Paragraph[]) => void
  ) => {
    if (paragraphs.length === 1) return;

    const newParagraphs = paragraphs
      .map(p => ({ ...p }))
      .filter((_, i) => i !== index);

    setParagraphs(newParagraphs);
  };

  const handleCreateChapter = async () => {
    if (!bookId) {
      console.error('Cannot create chapter: bookId is missing', { bookId, book, bookData });
      alert('Lỗi: Không tìm thấy ID sách. Vui lòng tải lại trang.');
      return;
    }

    if (!newChapterTitle.trim()) {
      alert('Vui lòng nhập tiêu đề chương');
      return;
    }

    console.log('Creating chapter with:', {
      bookId, // Backend expects bookId (ObjectId), not slug
      bookSlug: book?.slug,
      title: newChapterTitle,
      paragraphs: newChapterParagraphs
    });

    try {
      // Note: The mutation parameter is named "bookSlug" but we're passing bookId
      // because the backend route expects an ObjectId, not a slug
      const result = await createChapter({
        bookSlug: bookId, // This is actually bookId, not slug!
        data: {
          title: newChapterTitle,
          paragraphs: newChapterParagraphs.filter(p => p.content.trim()),
        },
      }).unwrap();

      console.log('Chapter created successfully:', result);
      setShowNewChapterForm(false);
      setNewChapterTitle('');
      setNewChapterParagraphs([{ id: uuidv4(), content: '' }]);
    } catch (error: any) {
      console.error('Failed to create chapter:', {
        error,
        errorData: error?.data,
        errorMessage: error?.message,
        errorStatus: error?.status,
      });
      alert(`Tạo chương thất bại: ${error?.data?.message || error?.message || 'Lỗi không xác định'}`);
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
                          {chapter.paragraphsCount || 0} đoạn • {chapter.viewsCount} lượt xem
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          if (expandedChapterId !== chapter.id) {
                            setExpandedChapterId(chapter.id);
                          }
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
                          {isFetchingDetails ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                      ) : (
                        // View Mode
                        <ChapterDetailView bookSlug={book!.slug} chapterId={chapter.id} />
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

function ChapterDetailView({ bookSlug, chapterId }: { bookSlug: string; chapterId: string }) {
  const { data: chapter, isLoading } = useGetChapterByIdQuery({ bookSlug, chapterId });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!chapter) {
    return <div className="text-red-500 py-4">Không thể tải nội dung chương.</div>;
  }

  return (
    <div className="space-y-3">
      {chapter.paragraphs.map((para, index) => (
        <p key={para.id} className="text-gray-800">
          {para.content}
        </p>
      ))}
    </div>
  );
}
