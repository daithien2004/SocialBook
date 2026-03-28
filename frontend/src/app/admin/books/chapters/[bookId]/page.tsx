'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useGetBookByIdQuery } from '@/features/books/api/bookApi';
import {
  useGetAdminChaptersQuery,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useGetChapterByIdQuery,
  useLazyGetChapterByIdQuery,
} from '@/features/chapters/api/chaptersApi';
import {
  useGenerateChapterAudioMutation,
  useGenerateBookAudioMutation,
} from '@/features/tts/api/ttsApi';
import { Chapter, Paragraph } from '@/features/chapters/types/chapter.interface';
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, Save, X, Loader2, Volume2, CheckCircle, XCircle, Clock, Upload } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { FileImportModal } from '@/components/chapter/FileImportModal';
import { getErrorMessage } from '@/lib/utils';

export default function ChapterManagementPage() {
  const params = useParams();
  const bookId = params.bookId as string;

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data: bookData, isLoading: isLoadingBook } = useGetBookByIdQuery(bookId);

  const { data: chaptersData, isFetching: isFetchingChapters, isLoading: isLoadingChapters, refetch: refetchChaptersQuery } = useGetAdminChaptersQuery({
    bookSlug: bookData?.slug || '',
    page,
    limit: 20
  }, {
    skip: !bookData?.slug,
  });

  const refetchChapters = () => {
    setPage(1);
    setChapters([]);
    refetchChaptersQuery();
  };

  // Infinite Scroll Effect
  useEffect(() => {
    if (chaptersData?.chapters) {
      if (page === 1) {
        setChapters(chaptersData.chapters);
      } else {
        setChapters(prev => [...prev, ...chaptersData.chapters]);
      }
      // Check if we reached the total or if returned less than limit
      const total = chaptersData.total || 0;
      const currentCount = (page - 1) * 20 + chaptersData.chapters.length;
      setHasMore(currentCount < total);
    }
  }, [chaptersData, page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isFetchingChapters) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '500px' } // Load 500px before reaching bottom
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isFetchingChapters]);

  const [triggerGetChapter, { isFetching: isFetchingDetails }] = useLazyGetChapterByIdQuery();
  const [createChapter, { isLoading: isCreating }] = useCreateChapterMutation();
  const [updateChapter, { isLoading: isUpdating }] = useUpdateChapterMutation();
  const [deleteChapter] = useDeleteChapterMutation();

  // TTS mutations
  const [generateChapterAudio, { isLoading: isGeneratingAudio }] = useGenerateChapterAudioMutation();
  const [generateBookAudio, { isLoading: isGeneratingAllAudio }] = useGenerateBookAudioMutation();

  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingParagraphs, setEditingParagraphs] = useState<Paragraph[]>([]);
  const [showNewChapterForm, setShowNewChapterForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterParagraphs, setNewChapterParagraphs] = useState<Paragraph[]>([
    { id: uuidv4(), content: '' },
  ]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const newChapterBottomRef = useRef<HTMLDivElement>(null);
  const editChapterBottomRef = useRef<HTMLDivElement>(null);

  const book = bookData;
  // const chapters = chaptersData?.chapters || []; // Removed old derivation



  const handleToggleExpand = (chapterId: string, e?: React.MouseEvent) => {
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
    setParagraphs: (p: Paragraph[]) => void,
    onPaste?: () => void
  ) => {
    // Tự động phân tách thành từng câu dựa trên dấu câu (. ! ?) và xuống dòng
    // Chỉ phân tách nếu user paste một đoạn văn dài có tính chất đa câu/xuống dòng
    // Tránh việc đang type dấu chấm (.) thì bị nhảy ô ngay lập tức gây khó chịu 
    const isPaste = content.length - paragraphs[index].content.length > 5;

    if (content.includes('\n') || (isPaste && /[.!?]\s/.test(content))) {
      // Phân tách bằng newline VÀ dấu câu (dấu chấm/hỏi/chấm than tiếp nối khoảng trắng)
      // Dùng regex để tách nhưng giữ lại text, ví dụ: "Câu 1. Câu 2" -> ["Câu 1.", "Câu 2"]
      const segments = content
        .split(/(?<=[.!?])\s+|\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (segments.length > 1) {
        const newParagraphs = paragraphs.map(p => ({ ...p }));

        // Đoạn đầu tiên vào current index
        newParagraphs[index].content = segments[0];

        // Các đoạn tiếp theo tạo ô mới
        const newItems = segments.slice(1).map(line => ({
          id: uuidv4(),
          content: line
        }));

        newParagraphs.splice(index + 1, 0, ...newItems);
        setParagraphs(newParagraphs);

        // Scroll to bottom if pasting
        if (onPaste) {
          setTimeout(onPaste, 100);
        }
        return;
      }
    }

    // Nếu chỉ gõ bình thường hoặc không có đoạn nào tách được
    const newParagraphs = paragraphs.map(p => ({ ...p }));
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
      toast.error('Không tìm thấy ID sách. Vui lòng tải lại trang.');
      return;
    }

    if (!newChapterTitle.trim()) {
      toast.info('Vui lòng nhập tiêu đề chương');
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
        bookSlug: book?.slug || '',
        data: {
          title: newChapterTitle,
          bookId: bookId,
          paragraphs: newChapterParagraphs.filter(p => p.content.trim()),
        },
      }).unwrap();


      console.log('Chapter created successfully:', result);
      setShowNewChapterForm(false);
      setNewChapterTitle('');
      setNewChapterParagraphs([{ id: uuidv4(), content: '' }]);
    } catch (error: unknown) {
      console.error('Failed to create chapter:', {
        error,
        errorData: (error as { data?: unknown })?.data,
        errorMessage: (error as { message?: string })?.message,
        errorStatus: (error as { status?: number })?.status,
      });
      toast.error(`Tạo chương thất bại: ${getErrorMessage(error)}`);
    }
  };

  // TTS handlers - NO hardcoded options to allow backend auto-detection
  const handleGenerateAudio = async (chapterId: string) => {
    try {
      const ttsResult = await generateChapterAudio({
        chapterId,
      }).unwrap();
      toast.success('Tạo audio thành công!');

      // Optimistic update: cập nhật ngay local state trước khi refetch
      setChapters(prev => prev.map(ch =>
        ch.id === chapterId
          ? { ...ch, ttsStatus: 'completed' as const, audioUrl: ttsResult.audioUrl }
          : ch
      ));

      // Refetch để đồng bộ với server (ttsApi và chaptersApi là 2 instance riêng)
      refetchChaptersQuery();
    } catch (error: unknown) {
      console.error('Failed to generate audio:', error);
      toast.error(`Tạo audio thất bại: ${getErrorMessage(error)}`);
    }
  };

  const handleGenerateAllAudio = async () => {
    if (!bookId) return;
    if (!confirm(`Bạn có chắc muốn tạo audio cho tất cả ${chapters.length} chương?`)) return;

    try {
      const result = await generateBookAudio({
        bookId,
      }).unwrap();

      alert(
        `Hoàn thành tạo audio!\n` +
        `Thành công: ${result.successful}/${result.total}\n` +
        `Thất bại: ${result.failed}`
      );

      // Refetch để lấy trạng thái mới nhất từ server
      setPage(1);
      setChapters([]);
      refetchChaptersQuery();
    } catch (error: unknown) {
      console.error('Failed to generate all audio:', error);
      alert(`Tạo audio thất bại: ${getErrorMessage(error)}`);
    }
  };

  const handleImportChapters = async (importedChapters: { title: string; content: string }[]) => {
    setIsImportModalOpen(false);
    let successCount = 0;
    let failCount = 0;

    const toastId = toast.loading(`Importing ${importedChapters.length} chapters...`);

    for (const chapter of importedChapters) {
      try {
        // Tách câu và đoạn (phân tách mảng lớn theo \n hoặc câu)
        const paragraphs = chapter.content
          .split(/(?<=[.!?])\s+|\n+/)
          .map(p => p.trim())
          .filter(p => p.length > 0)
          .map(p => ({
            id: uuidv4(),
            content: p
          }));

        if (!book?.slug) {
          toast.error('Book information missing');
          return;
        }

        // Skip chapters with no content
        if (paragraphs.length === 0) {
          console.warn(`Skipping chapter "${chapter.title}" because it has no content`);
          failCount++;
          continue;
        }

        await createChapter({
          bookSlug: book.slug,
          data: {
            title: chapter.title || `Chapter ${successCount + 1}`,
            bookId: bookId,       // required by CreateChapterDto
            paragraphs: paragraphs,
          },
        }).unwrap();

        successCount++;
      } catch (error: unknown) {
        console.error(`Failed to import chapter ${chapter.title}:`, error);
        failCount++;
        // Show specific error for the first failure
        if (failCount === 1) {
          toast.error(`Import failed for "${chapter.title}": ${getErrorMessage(error)}`);
        }
      }
    }

    toast.dismiss(toastId);
    if (failCount === 0) {
      toast.success(`Successfully imported all ${successCount} chapters!`);
    } else {
      toast.warning(`Imported ${successCount} chapters. Failed: ${failCount}`);
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
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý chương</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sách: <span className="font-semibold text-gray-800">{book?.title}</span> • {chapters.length} chương
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateAllAudio}
              disabled={isGeneratingAllAudio || chapters.length === 0}
              className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isGeneratingAllAudio ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
              <span>Tạo Audio</span>
            </button>
            <button
              onClick={() => setShowNewChapterForm(!showNewChapterForm)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow hover:-translate-y-0.5 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>Thêm chương</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow hover:-translate-y-0.5 group"
            >
              <Upload className="w-5 h-5" />
              <span>Import File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-0">
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
                      onChange={(e) => handleParagraphChange(
                        index,
                        e.target.value,
                        newChapterParagraphs,
                        setNewChapterParagraphs,
                        () => newChapterBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
                      )}
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
                <div ref={newChapterBottomRef} />
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
                    className="flex items-center justify-between px-4 py-3 cursor-pointer sticky top-0 z-10 bg-white border-b border-gray-50"
                    onClick={(e) => handleToggleExpand(chapter.id, e)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {expandedChapterId === chapter.id ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          CHƯƠNG {chapter.orderIndex}: {chapter.title}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-3">
                          <span>{chapter.paragraphsCount || 0} đoạn</span>
                          <span>•</span>
                          <span>{chapter.viewsCount} lượt xem</span>
                          <span>•</span>
                          <TTSStatusBadge status={chapter.ttsStatus} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <TTSButton
                        chapterId={chapter.id}
                        status={chapter.ttsStatus}
                        audioUrl={chapter.audioUrl}
                        onGenerate={handleGenerateAudio}
                      />
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
                                      onChange={(e) => handleParagraphChange(
                                        index,
                                        e.target.value,
                                        editingParagraphs,
                                        setEditingParagraphs,
                                        () => editChapterBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
                                      )}
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
                                <div ref={editChapterBottomRef} />
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
                  {/* Loading Sentinel */}
                  <div ref={observerTarget} className="flex justify-center items-center">
                    {isFetchingChapters && page > 1 && <Loader2 className="w-6 h-6 animate-spin text-blue-500" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportChapters}
        isLoading={isCreating}
        bookSlug={book?.slug || ''}
        currentChapterCount={chapters.length}
      />
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

// Status Badge Component
function TTSStatusBadge({ status }: { status?: 'pending' | 'processing' | 'completed' | 'failed' }) {
  if (!status) {
    return <span className="text-xs text-gray-400">🔇 Chưa có audio</span>;
  }

  if (status === 'completed') {
    return <span className="text-xs text-green-600 font-medium">✓ Có audio</span>;
  } else if (status === 'processing' || status === 'pending') {
    return <span className="text-xs text-yellow-600 font-medium">⏳ Đang tạo...</span>;
  } else if (status === 'failed') {
    return <span className="text-xs text-red-600 font-medium">✗ Lỗi</span>;
  }

  return null;
}

// TTS Button Component
function TTSButton({
  chapterId,
  status,
  audioUrl,
  onGenerate
}: {
  chapterId: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  onGenerate: (id: string) => void
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(chapterId);
    } finally {
      setIsGenerating(false);
    }
  };

  if (status) {
    if (status === 'completed') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (audioUrl) {
              window.open(audioUrl, '_blank');
            }
          }}
          className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
          title="Audio đã tạo - Click để nghe"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
        </button>
      );
    } else if (status === 'processing' || status === 'pending') {
      return (
        <button className="p-2 bg-yellow-100 rounded-lg" title="Đang tạo audio...">
          <Clock className="w-5 h-5 text-yellow-600" />
        </button>
      );
    } else if (status === 'failed') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleGenerate();
          }}
          disabled={isGenerating}
          className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
          title="Lỗi - Click để thử lại"
        >
          <XCircle className="w-5 h-5 text-red-600" />
        </button>
      );
    }
  }

  // No audio yet
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleGenerate();
      }}
      disabled={isGenerating}
      className="p-2 bg-purple-100 hover:bg-purple-200 disabled:opacity-50 rounded-lg transition-colors"
      title="Tạo audio"
    >
      {isGenerating ? (
        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
      ) : (
        <Volume2 className="w-5 h-5 text-purple-600" />
      )}
    </button>
  );
}
