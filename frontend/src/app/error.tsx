'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-2xl font-bold">Đã xảy ra lỗi không mong muốn</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || 'Hệ thống gặp sự cố trong quá trình xử lý yêu cầu.'}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
      >
        Thử lại
      </button>
    </div>
  );
}
