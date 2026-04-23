'use client';

import { useState } from 'react';
import { useGetChapterByIdQuery } from '@/features/chapters/api/chaptersApi';
import { 
  Plus, ChevronDown, ChevronRight, Edit2, Trash2, 
  Save, X, Loader2, Volume2, CheckCircle, XCircle, Clock, Upload 
} from 'lucide-react';
import { FileImportModal } from '@/components/chapter/FileImportModal';
import { useChapterManagement } from '@/features/admin/hooks/chapters/useChapterManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ChapterManagementPage() {
  const {
    bookId,
    book,
    chapters,
    isLoadingBook,
    isLoadingChapters,
    isFetchingChapters,
    isFetchingDetails,
    isCreating,
    isUpdating,
    isGeneratingAllAudio,
    isStartingImport,
    page,
    expandedChapterId,
    editingChapterId,
    editingTitle,
    editingParagraphs,
    showNewChapterForm,
    newChapterTitle,
    newChapterParagraphs,
    isImportModalOpen,
    observerTarget,
    newChapterBottomRef,
    editChapterBottomRef,
    setEditingTitle,
    setEditingParagraphs,
    setShowNewChapterForm,
    setNewChapterTitle,
    setNewChapterParagraphs,
    setIsImportModalOpen,
    handleToggleExpand,
    handleExpandAndEdit,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteChapter,
    handleParagraphChange,
    handleParagraphKeyDown,
    handleDeleteParagraph,
    handleCreateChapter,
    handleGenerateAudio,
    handleGenerateAllAudio,
    handleImportChapters,
  } = useChapterManagement();

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
            <Button
              onClick={handleGenerateAllAudio}
              disabled={isGeneratingAllAudio || chapters.length === 0}
              className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white transition-all shadow-sm group"
            >
              {isGeneratingAllAudio ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
              <span>Tạo Audio</span>
            </Button>
            <Button
              onClick={() => setShowNewChapterForm(!showNewChapterForm)}
              className="flex items-center gap-2 transition-all shadow-sm group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>Thêm chương</span>
            </Button>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2 text-emerald-700 border-emerald-600 hover:bg-emerald-50 transition-all shadow-sm group"
            >
              <Upload className="w-5 h-5" />
              <span>Import File</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* New Chapter Form */}
          {showNewChapterForm && (
            <div className="border-b border-gray-200 p-6 bg-blue-50/50">
              <h3 className="font-semibold text-lg mb-4">Tạo chương mới</h3>
              <Input
                type="text"
                placeholder="Tiêu đề chương..."
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="mb-4 bg-white"
              />
              <div className="space-y-2">
                {newChapterParagraphs.map((para, index) => (
                  <div key={`${para.id}-${index}`} className="flex gap-2">
                    <Textarea
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
                      className="resize-none bg-white min-h-[80px]"
                    />
                    {newChapterParagraphs.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteParagraph(index, newChapterParagraphs, setNewChapterParagraphs)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                ))}
                <div ref={newChapterBottomRef} />
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleCreateChapter}
                  disabled={isCreating || !newChapterTitle.trim()}
                  className="flex items-center gap-2"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Tạo chương
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewChapterForm(false);
                    setNewChapterTitle('');
                    setNewChapterParagraphs([{ id: crypto.randomUUID(), content: '' }]);
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Hủy
                </Button>
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
              chapters.map((chapter, index) => (
                <div key={`${chapter.id}-${index}`} className="hover:bg-gray-50 transition-colors">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExpandAndEdit(chapter)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-100"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteChapter(chapter.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100"
                        title="Xóa"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Chapter Content (Expanded) */}
                  {expandedChapterId === chapter.id && (
                    <div className="px-4 pb-4 bg-gray-50">
                      {editingChapterId === chapter.id ? (
                        // Edit Mode
                        <div className="space-y-4 pt-4">
                          {isFetchingDetails ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                          ) : (
                            <>
                              <Input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="font-semibold bg-white"
                              />
                              <div className="space-y-2">
                                {editingParagraphs.map((para, index) => (
                                  <div key={`${para.id}-${index}`} className="flex gap-2">
                                    <Textarea
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
                                      className="resize-none bg-white min-h-[80px]"
                                    />
                                    {editingParagraphs.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteParagraph(index, editingParagraphs, setEditingParagraphs)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-100 flex-shrink-0"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                                <div ref={editChapterBottomRef} />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleSaveEdit(chapter.id)}
                                  disabled={isUpdating}
                                  className="flex items-center gap-2"
                                >
                                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                  Lưu thay đổi
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="flex items-center gap-2"
                                >
                                  <X className="w-4 h-4" />
                                  Hủy
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        // View Mode
                        <div className="pt-4">
                          <ChapterDetailView bookSlug={book!.slug} chapterId={chapter.id} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {/* Loading Sentinel for infinite scroll — must be OUTSIDE the map */}
          <div ref={observerTarget} className="flex justify-center items-center py-4">
            {isFetchingChapters && page > 1 && <Loader2 className="w-6 h-6 animate-spin text-blue-500" />}
          </div>
        </div>
      </div>

      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportChapters}
        isLoading={isCreating || isStartingImport}
        bookSlug={book?.slug || ''}
        currentChapterCount={chapters.length}
        bookId={bookId}
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
        <p key={`${para.id}-${index}`} className="text-gray-800 leading-relaxed">
          {para.content}
        </p>
      ))}
    </div>
  );
}

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
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            if (audioUrl) {
              window.open(audioUrl, '_blank');
            }
          }}
          className="text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border-transparent"
          title="Audio đã tạo - Click để nghe"
        >
          <CheckCircle className="w-5 h-5" />
        </Button>
      );
    } else if (status === 'processing' || status === 'pending') {
      return (
        <Button variant="outline" size="icon" disabled className="bg-yellow-50 border-transparent">
          <Clock className="w-5 h-5 text-yellow-600" />
        </Button>
      );
    } else if (status === 'failed') {
      return (
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleGenerate();
          }}
          disabled={isGenerating}
          className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border-transparent"
          title="Lỗi - Click để thử lại"
        >
          <XCircle className="w-5 h-5" />
        </Button>
      );
    }
  }

  // No audio yet
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        handleGenerate();
      }}
      disabled={isGenerating}
      className="text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border-transparent disabled:opacity-50"
      title="Tạo audio"
    >
      {isGenerating ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Volume2 className="w-5 h-5" />
      )}
    </Button>
  );
}
