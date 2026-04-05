'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useGetBookByIdQuery } from '@/features/books/api/bookApi';
import {
  useGetAdminChaptersQuery,
  useDeleteChapterMutation,
  useGetChapterByIdQuery,
} from '@/features/chapters/api/chaptersApi';
import {
  useGenerateChapterAudioMutation,
  useGenerateBookAudioMutation,
} from '@/features/tts/api/ttsApi';
import { Chapter } from '@/features/chapters/types/chapter.interface';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  Loader2, 
  Volume2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { useModalStore } from '@/store/useModalStore';

export default function ChapterManagementPage() {
  const params = useParams();
  const bookId = params.bookId as string;

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data: bookData, isLoading: isLoadingBook } = useGetBookByIdQuery(bookId);

  const { 
    data: chaptersData, 
    isFetching: isFetchingChapters, 
    isLoading: isLoadingChapters, 
    refetch: refetchChaptersQuery 
  } = useGetAdminChaptersQuery({
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

  const { openConfirm, openFileImport, openManageChapter } = useModalStore();

  // Infinite Scroll Effect
  useEffect(() => {
    if (chaptersData?.chapters) {
      if (page === 1) {
        setChapters(chaptersData.chapters);
      } else {
        setChapters(prev => [...prev, ...chaptersData.chapters]);
      }
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
      { threshold: 0.1, rootMargin: '500px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isFetchingChapters]);

  const [deleteChapter] = useDeleteChapterMutation();
  const [generateChapterAudio] = useGenerateChapterAudioMutation();
  const [generateBookAudio, { isLoading: isGeneratingAllAudio }] = useGenerateBookAudioMutation();

  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  const book = bookData;

  const handleToggleExpand = (chapterId: string) => {
    setExpandedChapterId(expandedChapterId === chapterId ? null : chapterId);
  };

  const handleDeleteChapter = (chapter: Chapter) => {
    if (!book?.slug) return;
    
    openConfirm({
      title: "Xóa chương",
      description: `Bạn có chắc chắn muốn xóa "${chapter.title}"? Hành động này không thể hoàn tác.`,
      variant: "destructive",
      confirmText: "Xóa ngay",
      onConfirm: async () => {
        try {
          await deleteChapter({ bookSlug: book.slug, chapterId: chapter.id }).unwrap();
          toast.success('Xóa chương thành công!');
          if (expandedChapterId === chapter.id) setExpandedChapterId(null);
          refetchChapters();
        } catch (error) {
          console.error('Failed to delete chapter:', error);
          toast.error(getErrorMessage(error));
        }
      }
    });
  };

  const handleGenerateAudio = async (chapterId: string) => {
    try {
      const ttsResult = await generateChapterAudio({ chapterId }).unwrap();
      toast.success('Tạo audio thành công!');
      setChapters(prev => prev.map(ch =>
        ch.id === chapterId ? { ...ch, ttsStatus: 'completed' as const, audioUrl: ttsResult.audioUrl } : ch
      ));
    } catch (error: unknown) {
      console.error('Failed to generate audio:', error);
      toast.error(`Tạo audio thất bại: ${getErrorMessage(error)}`);
    }
  };

  const handleGenerateAllAudio = () => {
    if (!bookId) return;
    
    openConfirm({
      title: "Tạo audio toàn bộ sách",
      description: `Hệ thống sẽ tạo âm thanh cho tất cả ${chapters.length} chương. Quá trình này có thể mất vài phút.`,
      confirmText: "Bắt đầu tạo",
      variant: "default",
      onConfirm: async () => {
        try {
          const result = await generateBookAudio({ bookId }).unwrap();
          toast.success(`Hoàn thành! Thành công: ${result.successful}, Thất bại: ${result.failed}`);
          refetchChapters();
        } catch (error: unknown) {
          console.error('Failed to generate all audio:', error);
          toast.error(`Lỗi: ${getErrorMessage(error)}`);
        }
      }
    });
  };

  if (isLoadingBook || (isLoadingChapters && page === 1)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between bg-white gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý chương</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sách: <span className="font-semibold text-gray-800">{book?.title}</span> • {chaptersData?.total || 0} chương
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handleGenerateAllAudio}
              disabled={isGeneratingAllAudio || chapters.length === 0}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
            >
              {isGeneratingAllAudio ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
              <span className="hidden sm:inline">Tạo Audio</span>
            </button>
            <button
              onClick={() => openManageChapter({ 
                bookId, 
                bookSlug: book?.slug || '', 
                onSuccess: refetchChapters 
              })}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow active:scale-95 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>Thêm chương</span>
            </button>
            <button
              onClick={() => openFileImport({
                bookSlug: book?.slug || '',
                currentChapterCount: chapters.length,
                onImport: () => refetchChapters()
              })}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow active:scale-95"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">Import File</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {chapters.length === 0 && !isFetchingChapters ? (
            <div className="text-center py-24 text-gray-500 bg-gray-50/30">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-lg font-medium">Chưa có chương nào cho sách này</p>
              <p className="text-sm mt-1">Hãy bắt đầu bằng cách thêm chương mới hoặc import file</p>
            </div>
          ) : (
            chapters.map((chapter) => (
              <div key={chapter.id} className="transition-all hover:bg-slate-50/50">
                <div
                  className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${expandedChapterId === chapter.id ? 'bg-blue-50/40 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                  onClick={() => handleToggleExpand(chapter.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-6 h-6 flex items-center justify-center text-gray-400">
                      {expandedChapterId === chapter.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 group flex items-center gap-2">
                        CHƯƠNG {chapter.orderIndex}: {chapter.title}
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {chapter.paragraphsCount || 0} đoạn
                        </span>
                        <span>•</span>
                        <span>{chapter.viewsCount.toLocaleString()} lượt xem</span>
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
                      onClick={() => openManageChapter({ 
                        bookId, 
                        bookSlug: book?.slug || '', 
                        chapter,
                        onSuccess: refetchChapters 
                      })}
                      className="p-2.5 hover:bg-white hover:shadow-md rounded-lg transition-all text-blue-600 active:scale-90"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteChapter(chapter)}
                      className="p-2.5 hover:bg-white hover:shadow-md rounded-lg transition-all text-red-600 active:scale-90"
                      title="Xóa"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {expandedChapterId === chapter.id && (
                  <div className="px-14 pb-8 pt-4 bg-slate-50/30 animate-in fade-in slide-in-from-top-1">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 overflow-hidden">
                       <ChapterDetailView bookSlug={book!.slug} chapterId={chapter.id} />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          
          <div ref={observerTarget} className="flex justify-center items-center py-8">
            {isFetchingChapters && page > 1 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                Đang tải thêm chương...
              </div>
            )}
            {!hasMore && chapters.length > 0 && (
              <p className="text-gray-400 text-sm font-medium italic">--- Đã tải hết tất cả chương ---</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChapterDetailView({ bookSlug, chapterId }: { bookSlug: string; chapterId: string }) {
  const { data: chapter, isLoading } = useGetChapterByIdQuery({ bookSlug, chapterId });
  
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-sm text-gray-500 font-medium">Đang tải nội dung...</p>
    </div>
  );
  
  if (!chapter) return (
    <div className="flex flex-col items-center justify-center py-12 text-red-500 bg-red-50 rounded-lg">
      <XCircle className="w-8 h-8 mb-2" />
      <p className="font-bold">Lỗi tải dữ liệu</p>
      <p className="text-xs">Không thể tìm thấy nội dung chương này.</p>
    </div>
  );

  return (
    <article className="prose prose-slate max-w-none space-y-4">
      {chapter.paragraphs.map((para) => (
        <p key={para.id} className="text-gray-700 leading-relaxed text-base">
          {para.content}
        </p>
      ))}
    </article>
  );
}

function TTSStatusBadge({ status }: { status?: 'pending' | 'processing' | 'completed' | 'failed' }) {
  const configs = {
    pending: { color: 'text-amber-600 bg-amber-50', icon: Clock, label: 'Đang chờ' },
    processing: { color: 'text-amber-600 bg-amber-50', icon: Loader2, label: 'Đang tạo...' },
    completed: { color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle, label: 'Đã có Audio' },
    failed: { color: 'text-red-600 bg-red-50', icon: XCircle, label: 'Lỗi tạo' },
  };

  if (!status) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-tight">
       🔇 Không Audio
    </span>
  );

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${config.color}`}>
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
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
    try { await onGenerate(chapterId); } finally { setIsGenerating(false); }
  };

  if (status === 'completed') {
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); if (audioUrl) window.open(audioUrl, '_blank'); }} 
        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-500/10 active:scale-95" 
        title="Nghe Audio"
      >
        <Volume2 className="w-5 h-5" />
      </button>
    );
  } else if (status === 'processing' || status === 'pending') {
    return (
      <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100 animate-pulse">
        <Clock className="w-5 h-5" />
      </div>
    );
  } else if (status === 'failed') {
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); handleGenerate(); }} 
        disabled={isGenerating} 
        className="p-2.5 bg-red-50 hover:bg-red-100 rounded-lg transition-all text-red-600 border border-red-100 active:scale-95" 
        title="Lỗi - Thử lại"
      >
        <XCircle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); handleGenerate(); }} 
      disabled={isGenerating} 
      className="p-2.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 rounded-lg transition-all text-blue-600 border border-blue-100 shadow-sm active:scale-95" 
      title="Tạo Audio"
    >
      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
    </button>
  );
}
