'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { useSummarizeChapterMutation } from '@/features/gemini/api/geminiApi';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#09090b]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <Sparkles size={16} className="text-white dark:text-black" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Tóm tắt AI</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-[#0c0c0c] flex-1">
          <h4 className="text-gray-500 dark:text-gray-400 font-medium mb-6 text-sm flex items-center gap-2">
            Đang tóm tắt: <span className="text-gray-900 dark:text-white font-semibold">{chapterTitle}</span>
          </h4>

          {/* Initial State */}
          {!summary && !isLoading && !hasFetched && (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles size={32} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div className="space-y-2">
                <p className="text-gray-900 dark:text-white font-medium">Bắt đầu tóm tắt</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                  Sử dụng trí tuệ nhân tạo để phân tích và tóm tắt nội dung chính của chương này trong vài giây.
                </p>
              </div>
              <button
                onClick={handleSummarize}
                className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto shadow-lg"
              >
                <Sparkles size={18} />
                Tạo tóm tắt
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16 space-y-4">
              <Loader2 size={32} className="animate-spin text-gray-900 dark:text-white mx-auto" />
              <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse font-medium">
                Đang xử lý nội dung...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12 space-y-4">
               <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={24} className="text-red-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Đã có lỗi xảy ra.
              </p>
              <button
                onClick={handleSummarize}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto text-gray-700 dark:text-gray-300"
              >
                <RefreshCw size={14} />
                Thử lại
              </button>
            </div>
          )}

          {/* Success State (Summary) */}
          {summary && !isLoading && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/5 rounded-2xl p-6 text-gray-800 dark:text-gray-200 leading-7 text-[15px] shadow-sm whitespace-pre-line">
                {summary}
              </div>
              <div className="mt-6 flex justify-center">
                 <button
                    onClick={handleSummarize}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                    title="Tạo lại tóm tắt mới"
                  >
                    <RefreshCw size={14} />
                    Tạo lại
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
