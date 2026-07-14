'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global layout error:', error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="bg-slate-50 dark:bg-black min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center text-center max-w-md w-full p-8 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-xl">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full scale-75 animate-pulse" />
            <div className="relative p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-3xl text-red-600 dark:text-red-400">
              <AlertTriangle size={48} className="animate-bounce duration-1000" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Lỗi Hệ Thống Nghiêm Trọng
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
            Có lỗi nghiêm trọng xảy ra trên toàn bộ ứng dụng. Hãy thử làm mới lại trình duyệt.
          </p>

          <Button
            onClick={() => reset()}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Tải lại ứng dụng
          </Button>
        </div>
      </body>
    </html>
  );
}
