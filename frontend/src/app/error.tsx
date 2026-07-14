'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Render error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center py-16">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full scale-75 animate-pulse" />
        <div className="relative p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-3xl text-red-600 dark:text-red-400">
          <AlertTriangle size={48} className="animate-bounce duration-1000" />
        </div>
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
        Đã xảy ra lỗi hệ thống
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed font-medium">
        Rất tiếc, đã có sự cố xảy ra trong quá trình xử lý trang. Vui lòng thử tải lại trang hoặc quay lại trang chủ.
      </p>

      {error.message && (
        <div className="mb-8 p-4 bg-slate-100 dark:bg-neutral-800 rounded-2xl max-w-lg overflow-x-auto text-left text-xs font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-neutral-700">
          <p className="font-bold mb-1">Chi tiết lỗi:</p>
          <p>{error.message}</p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <Button
          onClick={() => reset()}
          className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-all flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Thử lại
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/')}
          className="h-12 px-6 border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-900 rounded-xl font-bold transition-all flex items-center gap-2"
        >
          <Home size={18} />
          Về trang chủ
        </Button>
      </div>
    </div>
  );
}
