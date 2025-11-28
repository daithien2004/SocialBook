'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { useSummarizeChapterMutation } from '@/src/features/gemini/api/geminiApi';
import { toast } from 'sonner';

interface ChapterSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterTitle: string;
}

export default function ChapterSummaryModal({
  isOpen,
  onClose,
  chapterId,
  chapterTitle,
}: ChapterSummaryModalProps) {
  const [summarize, { isLoading, error, data: summary }] =
    useSummarizeChapterMutation();
  const [hasFetched, setHasFetched] = useState(false);

  // Reset state when modal closes or chapter changes
  useEffect(() => {
    if (!isOpen) {
      // Optional: reset state if needed, but RTK Query handles caching.
      // If we want to force fresh fetch every time, we might need to reset.
      // For now, let's keep the cache if it exists, but local state 'hasFetched' helps UI logic.
    } else {
        // If we want to auto-fetch:
        // if (!summary && !hasFetched) handleSummarize();
    }
  }, [isOpen]);

  const handleSummarize = async () => {
    try {
      await summarize(chapterId).unwrap();
      setHasFetched(true);
    } catch (err) {
      console.error('Summarize failed', err);
      toast.error('Không thể tạo tóm tắt. Vui lòng thử lại.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-neutral-900/50">
          <div className="flex items-center gap-2 text-blue-400">
            <Sparkles size={20} />
            <h3 className="font-bold text-lg text-white">Tóm tắt AI</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <h4 className="text-neutral-300 font-medium mb-4">
            Chương: <span className="text-white">{chapterTitle}</span>
          </h4>

          {/* Initial State */}
          {!summary && !isLoading && !hasFetched && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-blue-500" />
              </div>
              <p className="text-neutral-400 text-sm">
                Sử dụng AI để tóm tắt nội dung chính của chương này.
                <br />
                Giúp bạn nắm bắt cốt truyện nhanh chóng.
              </p>
              <button
                onClick={handleSummarize}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 mx-auto"
              >
                <Sparkles size={18} />
                Tạo tóm tắt ngay
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12 space-y-4">
              <Loader2 size={40} className="animate-spin text-blue-500 mx-auto" />
              <p className="text-neutral-400 text-sm animate-pulse">
                Đang phân tích nội dung chương...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8 space-y-4">
               <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={32} className="text-red-500" />
              </div>
              <p className="text-red-400 text-sm">
                Đã có lỗi xảy ra khi tạo tóm tắt.
              </p>
              <button
                onClick={handleSummarize}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={16} />
                Thử lại
              </button>
            </div>
          )}

          {/* Success State (Summary) */}
          {summary && !isLoading && (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 text-neutral-200 leading-relaxed whitespace-pre-line">
                {summary}
              </div>
              <div className="mt-4 flex justify-end">
                 <button
                    onClick={handleSummarize}
                    className="text-xs text-neutral-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                    title="Tạo lại tóm tắt mới"
                  >
                    <RefreshCw size={12} />
                    Làm mới
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
